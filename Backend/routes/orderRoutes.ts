import express, { Response } from 'express';
import { Order, Medicine, User } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private - 'customer'
router.post('/', protect, authorize('customer'), async (req: AuthRequest, res: Response) => {
  try {
    const { pharmacyId, items, total, destination, address, city, zip } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Validate that all medicines exist and check stock
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine ${item.medicine} not found` });
      }
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
      }
    }

    // Create order
    const order = new Order({
      pharmacyId,
      customerEmail: req.user.email,
      items,
      total,
      status: 'Pending',
      destination: {
        lat: destination?.lat || 0,
        lng: destination?.lng || 0
      },
      pickup: {
        lat: 0,
        lng: 0
      }
    });

    // Reduce medicine stock
    for (const item of items) {
      await Medicine.findByIdAndUpdate(
        item.medicine,
        { $inc: { stock: -item.quantity } }
      );
    }

    const savedOrder = await order.save();
    const populatedOrder = await savedOrder.populate('items.medicine');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (admin) or user's orders (customer/owner)
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};
    
    if (req.user.role === 'customer') {
      // Customers see only their orders
      query.customerEmail = req.user.email;
    } else if (req.user.role === 'owner') {
      // Owners see orders for their pharmacies
      // Note: This assumes owner has a pharmacyId field in User model
      // For now, we'll return all orders (you may need to adjust)
      query.pharmacyId = req.user.shopCode; // or use a pharmacyId field
    }
    // Admin can see all orders

    const orders = await Order.find(query)
      .populate('items.medicine')
      .populate('pharmacyId', 'name city')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.medicine')
      .populate('pharmacyId', 'name city')
      .populate('driverId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/orders/:id
// @desc    Update order status
// @access  Private - 'admin' or 'owner'
router.patch('/:id', protect, authorize('admin', 'owner'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, driverId, currentLocation } = req.body;

    if (status && !['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (driverId) updateData.driverId = driverId;
    if (currentLocation) {
      updateData.currentLocation = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        updatedAt: new Date()
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('items.medicine');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/orders/:id/driver-progress
// @desc    Update driver progress for live tracking
// @access  Private - 'driver'
router.patch('/:id/driver-progress', protect, authorize('driver'), async (req: AuthRequest, res: Response) => {
  try {
    const { driverProgress, currentLocation } = req.body;

    if (driverProgress < 0 || driverProgress > 1) {
      return res.status(400).json({ message: 'Driver progress must be between 0 and 1' });
    }

    const updateData: any = { driverProgress };
    if (currentLocation) {
      updateData.currentLocation = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        updatedAt: new Date()
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Driver progress updated',
      data: updatedOrder
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete an order (cancel order)
// @access  Private - 'admin'
router.delete('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore medicine stock
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(
        item.medicine,
        { $inc: { stock: item.quantity } }
      );
    }

    await Order.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/stats/overview
// @desc    Get order statistics
// @access  Private
router.get('/stats/overview', protect, async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};
    
    if (req.user.role === 'customer') {
      query.customerEmail = req.user.email;
    } else if (req.user.role === 'owner') {
      query.pharmacyId = req.user.shopCode;
    }

    const totalOrders = await Order.countDocuments(query);
    const deliveredOrders = await Order.countDocuments({ ...query, status: 'Delivered' });
    const pendingOrders = await Order.countDocuments({ ...query, status: { $in: ['Pending', 'Confirmed', 'Preparing', 'Ready'] } });
    
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
