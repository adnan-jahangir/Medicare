import express, { Response } from 'express';
import { Order, User } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';
import { applyOrderPrivacy } from '../middleware/privacy.js';

const router = express.Router();
router.use(applyOrderPrivacy);

// ── Driver State Machine: Valid Transitions ──────────────────────────
const VALID_DRIVER_TRANSITIONS: Record<string, string[]> = {
  'Driver Assigned': ['Picked Up'],
  'Picked Up':       ['On the Way'],
  'On the Way':      ['Arrived'],
  'Arrived':         [],  // OTP route handles completion
};

// @route   GET /api/delivery/available
// @desc    Get orders ready for pickup
// @access  Private - 'driver'
router.get('/available', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ status: 'Ready' })
      .populate('pharmacyId', 'name city')
      .populate('items.medicine')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/delivery/active
// @desc    Get driver's current active delivery
// @access  Private - 'driver'
router.get('/active', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ 
      driverId: req.user.id, 
      status: { $in: ['Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'] } 
    }).populate('pharmacyId', 'name city').populate('items.medicine');

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/delivery/history
// @desc    Get driver's completed delivery history
// @access  Private - 'driver'
router.get('/history', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ 
      driverId: req.user.id, 
      status: { $in: ['Delivered', 'Completed'] } 
    })
      .populate('pharmacyId', 'name city')
      .populate('items.medicine')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/delivery/accept/:id
// @desc    Accept an order for delivery (Race Condition / Concurrency Control)
// @access  Private - 'driver'
router.post('/accept/:id', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    const driverId = req.user.id;

    // Concurrency control using atomic findOneAndUpdate.
    // This query guarantees that if multiple drivers accept the same order at the exact same millisecond:
    // Only the first driver matching status 'Ready' and driverId not existing will perform the update.
    // The subsequent requests will return null because the status is no longer 'Ready' or driverId is already assigned.
    // Also prevents accepting cancelled orders.
    const updatedOrder = await Order.findOneAndUpdate(
      { 
        _id: orderId, 
        status: 'Ready', 
        driverId: { $exists: false } 
      },
      { 
        $set: { 
          status: 'Driver Assigned', 
          driverId: driverId 
        } 
      },
      { 
        new: true 
      }
    ).populate('pharmacyId', 'name city').populate('items.medicine');

    if (!updatedOrder) {
      // Check if order exists but is cancelled or already assigned
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (existingOrder.status === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'This order has been cancelled' });
      }
      // Otherwise it was already taken by another driver
      return res.status(409).json({ 
        success: false, 
        message: 'Order already accepted by another driver' 
      });
    }

    // Notify customers and other drivers via Socket.io
    const io = req.app.get('io');
    if (io) {
      const payload = { status: 'Driver Assigned', orderId };
      io.to(`room_${orderId}`).emit('order:statusChanged', payload);
      io.to(`order:${orderId}`).emit('order:statusChanged', payload);

      // Notify pharmacy
      const pharmId = updatedOrder.pharmacyId?._id?.toString() || updatedOrder.pharmacyId?.toString();
      if (pharmId) {
        io.to(`pharmacy_${pharmId}`).emit('order:statusChanged', payload);
      }
    }

    res.json({ 
      success: true, 
      message: 'Order assigned successfully', 
      data: updatedOrder 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/delivery/status/:id
// @desc    Update delivery status
// @access  Private - 'driver'
router.patch('/status/:id', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Identity Spoofing Protection (verify that driver matches database assigned driver)
    console.log(`[Status Change Attempt] orderId: ${orderId}, order.driverId: ${order.driverId?.toString()}, req.user._id: ${req.user?._id?.toString()}`);
    if (order.driverId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Identity Spoofing Prevention: Not authorized for this delivery' });
    }

    // State Machine Validation: ensure driver can only make valid transitions
    const allowedNext = VALID_DRIVER_TRANSITIONS[order.status];
    if (!allowedNext || !allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: '${order.status}' → '${status}'. Allowed: [${(allowedNext || []).join(', ')}]`
      });
    }

    order.status = status;
    
    // If status is Arrived, generate OTP for delivery verification
    if (status === 'Arrived') {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      order.otp = otp;
      order.otpExpiresAt = new Date(Date.now() + 15 * 60000); // 15 mins expiry
      
      console.log(`\n========================================\n[TWILIO SIMULATION] Sending OTP ${otp} to customer: ${order.customerEmail}\n========================================\n`);
    }

    await order.save();
    
    // Notify clients of the status change via Socket.io rooms
    const io = req.app.get('io');
    if (io) {
      const payload = { status, orderId };
      io.to(`room_${orderId}`).emit('order:statusChanged', payload);
      io.to(`order:${orderId}`).emit('order:statusChanged', payload);

      // Notify pharmacy
      const pharmId = order.pharmacyId?.toString();
      if (pharmId) {
        io.to(`pharmacy_${pharmId}`).emit('order:statusChanged', payload);
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('pharmacyId', 'name city')
      .populate('items.medicine');

    res.json({ success: true, message: `Status updated: ${status}`, data: populatedOrder });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/delivery/verify-otp/:id
// @desc    Verify customer OTP and complete delivery (Credit Wallet & Destroy Socket Rooms)
// @access  Private - 'driver'
router.post('/verify-otp/:id', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const { otp } = req.body;
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Identity Spoofing Protection
    if (order.driverId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Identity Spoofing Prevention: Not authorized for this delivery' });
    }

    // Verify OTP
    if (order.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (order.otpExpiresAt && order.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Update status to Completed
    order.status = 'Completed';
    order.otp = undefined;
    order.otpExpiresAt = undefined;
    await order.save();

    // Credit delivery fee (৳35) to driver's wallet in user model
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { wallet: 35 }
    });

    console.log(`[Wallet Credited] Driver ${req.user.name} credited ৳35 for order #${orderId}`);

    // Emit live status update and destroy tracking rooms
    const io = req.app.get('io');
    if (io) {
      const room1 = `room_${orderId}`;
      const room2 = `order:${orderId}`;
      
      // Notify customer of completion
      io.to(room1).emit('order:statusChanged', { status: 'Completed' });
      io.to(room2).emit('order:statusChanged', { status: 'Completed' });
      
      // Destroy rooms by forcing all sockets to leave
      io.in(room1).socketsLeave(room1);
      io.in(room2).socketsLeave(room2);
      console.log(`[Socket tracking] Rooms ${room1} and ${room2} destroyed.`);
    }

    res.json({ success: true, message: 'Delivery completed successfully! Wallet credited ৳35.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
