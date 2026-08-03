import express, { Response } from 'express';
import { Order, Medicine, User, Pharmacy } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';
import { applyOrderPrivacy } from '../middleware/privacy.js';

const router = express.Router();
router.use(applyOrderPrivacy);

// ── State Machine: Valid Transitions Map ──────────────────────────────
// Each key maps to an array of statuses it can transition TO.
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Pending':         ['Confirmed', 'Cancelled'],
  'Confirmed':       ['Preparing', 'Cancelled'],
  'Preparing':       ['Ready', 'Cancelled'],
  'Ready':           ['Driver Assigned', 'Cancelled'],
  'Driver Assigned': ['Picked Up', 'Cancelled'],
  'Picked Up':       ['On the Way'],
  'On the Way':      ['Arrived'],
  'Arrived':         ['Delivered', 'Completed'],
  'Delivered':       ['Completed'],
  'Completed':       [],
  'Cancelled':       [],
};

const isValidTransition = (from: string, to: string): boolean => {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
};

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private - 'customer'
router.post('/', protect, authorize('customer'), async (req: AuthRequest, res: Response) => {
  try {
    const { pharmacyId, items, total, destination, deliveryAddress, address, city, zip } = req.body;

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

    // Retrieve pharmacy coordinates for order pickup location
    const pharmacy = await Pharmacy.findById(pharmacyId);
    let pickupLat = 22.3568; // Chittagong default
    let pickupLng = 91.7832;
    if (pharmacy) {
      const loc = (pharmacy as any).location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        pickupLat = loc.lat;
        pickupLng = loc.lng;
      } else if (pharmacy.city === 'Karachi') {
        pickupLat = 24.8607;
        pickupLng = 67.0011;
      } else if (pharmacy.city === 'New York') {
        pickupLat = 40.7484;
        pickupLng = -73.9857;
      }
    }

    // Create order
    const order = new Order({
      pharmacyId,
      customerEmail: req.user.email,
      customerName: req.body.customerName || req.user.name || '',
      customerPhone: req.body.customerPhone || req.user.phoneNumber || '',
      items,
      total,
      status: 'Pending',
      destination: {
        lat: destination?.lat || 0,
        lng: destination?.lng || 0
      },
      deliveryAddress: {
        lat: Number(deliveryAddress?.lat ?? destination?.lat ?? 0),
        lng: Number(deliveryAddress?.lng ?? destination?.lng ?? 0)
      },
      pickup: {
        lat: pickupLat,
        lng: pickupLng
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

    // Real-time: Notify pharmacy of new order
    const io = req.app.get('io');
    if (io) {
      io.to(`pharmacy_${pharmacyId}`).emit('order:newOrder', {
        orderId: populatedOrder._id,
        customerEmail: req.user.email,
        customerName: req.user.name || req.body.customerName || '',
        total,
        itemCount: items.length,
        status: 'Pending',
      });
    }

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
      // Customers see only their orders (case-insensitive email regex match)
      query.customerEmail = new RegExp(`^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    } else if (['owner', 'pharmacy', 'vendor', 'shop_owner'].includes(req.user.role)) {
      let rawPharmId = req.user.shopCode;
      let pharmacy = null;
      if (rawPharmId && /^[0-9a-fA-F]{24}$/.test(rawPharmId)) {
        pharmacy = await Pharmacy.findById(rawPharmId);
      }
      if (!pharmacy) {
        pharmacy = await Pharmacy.findOne();
        if (pharmacy) rawPharmId = pharmacy._id.toString();
      }
      query.pharmacyId = rawPharmId;
    }
    // Admin can see all orders

    const orders = await Order.find(query)
      .populate('items.medicine')
      .populate('pharmacyId', 'name city')
      .populate('driverId', 'name phoneNumber profilePhoto vehicleType licensePlate rating')
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

// @route   GET /api/orders/stats/overview
// @desc    Get order statistics
// @access  Private
router.get('/stats/overview', protect, async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};
    
    if (req.user.role === 'customer') {
      query.customerEmail = req.user.email;
    } else if (['owner', 'pharmacy', 'vendor', 'shop_owner'].includes(req.user.role)) {
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

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.medicine')
      .populate('pharmacyId', 'name city')
      .populate('driverId', 'name phoneNumber profilePhoto rating');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    const isShopOwnerRole = ['owner', 'pharmacy', 'vendor', 'shop_owner'].includes(req.user.role);
    if (isShopOwnerRole) {
      const orderPharmacyId = order.pharmacyId?._id?.toString() || order.pharmacyId?.toString();
      if (!req.user.shopCode || orderPharmacyId !== req.user.shopCode.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this order (belongs to another pharmacy)' });
      }
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
// @desc    Update order status (Supports admin, owner, pharmacy, driver, and customer order cancellation)
// @access  Private
router.patch('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { status, driverId, currentLocation } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isCustomer = req.user.role === 'customer';
    const isShopOwnerRole = ['owner', 'pharmacy', 'vendor', 'shop_owner'].includes(req.user.role);

    // Customer Authorization check: Customers can only cancel their own active orders
    if (isCustomer) {
      if (order.customerEmail !== req.user.email) {
        return res.status(403).json({ message: 'Not authorized to update this order' });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({ message: 'Customers can only cancel their orders' });
      }
      if (!['Pending', 'Confirmed', 'Preparing'].includes(order.status)) {
        return res.status(400).json({ message: `Cannot cancel order after it has been picked up or dispatched (Current: ${order.status})` });
      }
    } else if (isShopOwnerRole) {
      // Check authorization: Owners/Pharmacies can only update status of orders belonging to their shop
      const orderPharmacyId = order.pharmacyId?._id?.toString() || order.pharmacyId?.toString();
      if (!req.user.shopCode || orderPharmacyId !== req.user.shopCode.toString()) {
        return res.status(403).json({ message: 'Not authorized to update orders for another pharmacy' });
      }
    }

    // State Machine Validation: ensure status transition is valid
    if (status && !isCustomer) {
      const allStatuses = Object.keys(VALID_TRANSITIONS);
      if (!allStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid order status: '${status}'` });
      }

      // Admin can bypass transition rules
      if (req.user.role !== 'admin' && !isValidTransition(order.status, status)) {
        return res.status(400).json({
          message: `Invalid status transition: '${order.status}' → '${status}'. Allowed: [${(VALID_TRANSITIONS[order.status] || []).join(', ')}]`
        });
      }

      // Pharmacy owners can only advance up to 'Ready' or Cancel
      if (isShopOwnerRole && !['Confirmed', 'Preparing', 'Ready', 'Cancelled'].includes(status)) {
        return res.status(403).json({
          message: `Pharmacy owners can only set status to: Confirmed, Preparing, Ready, or Cancelled`
        });
      }
    }

    // If order is cancelled, restore medicine stock
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.items) {
        try {
          await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stock: item.quantity } });
        } catch (e) {}
      }
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
    ).populate('items.medicine').populate('pharmacyId', 'name city');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit live status update to all tracking rooms
    const io = req.app.get('io');
    if (io && status) {
      const orderId = updatedOrder._id.toString();
      const payload = { status: updatedOrder.status, orderId };

      io.to(`room_${orderId}`).emit('order:statusChanged', payload);
      io.to(`order:${orderId}`).emit('order:statusChanged', payload);

      // Notify pharmacy dashboard
      const pharmId = updatedOrder.pharmacyId?._id?.toString() || updatedOrder.pharmacyId?.toString();
      if (pharmId) {
        io.to(`pharmacy_${pharmId}`).emit('order:statusChanged', payload);
      }

      // When order becomes Ready, notify all online drivers
      if (status === 'Ready') {
        io.emit('order:newAvailable', { orderId, pharmacyName: (updatedOrder.pharmacyId as any)?.name || 'Pharmacy' });
      }
    }

    res.json({
      success: true,
      message: `Order status updated: ${order.status} → ${updatedOrder.status}`,
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

    if (typeof driverProgress !== 'number' || driverProgress < 0 || driverProgress > 1) {
      return res.status(400).json({ message: 'Driver progress must be a number between 0 and 1' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const currentUserId = (req.user._id || req.user.id).toString();
    if (!order.driverId) {
      order.driverId = req.user._id;
    } else if (order.driverId.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
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

    // Emit live tracking data to both socket rooms so the frontend
    // useOrderSocket hook receives it via location_changed / order:driverLocation
    const io = req.app.get('io');
    if (io) {
      const orderId = updatedOrder._id.toString();
      const payload = {
        orderId,
        driverProgress: updatedOrder.driverProgress,
        currentLocation: updatedOrder.currentLocation,
      };
      io.to(`room_${orderId}`).emit('location_changed', payload);
      io.to(`room_${orderId}`).emit('order:driverLocation', payload);
      io.to(`order:${orderId}`).emit('location_changed', payload);
      io.to(`order:${orderId}`).emit('order:driverLocation', payload);
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

export default router;
