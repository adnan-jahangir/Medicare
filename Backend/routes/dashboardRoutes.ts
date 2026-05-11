import express, { Response } from 'express';
import { Order, Medicine, User, Pharmacy } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard stats
// @access  Private - 'admin'
router.get('/admin', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPharmacies = await Pharmacy.countDocuments();
    const totalMedicines = await Medicine.countDocuments();
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('pharmacyId', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const topMedicines = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.medicine', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPharmacies,
          totalMedicines,
          totalOrders,
          deliveredOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recentOrders,
        usersByRole,
        topMedicines
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/owner
// @desc    Get owner dashboard stats
// @access  Private - 'owner'
router.get('/owner', protect, authorize('owner'), async (req: AuthRequest, res: Response) => {
  try {
    // Get pharmacy ID from user's shop code (adjust query as needed)
    const pharmacyId = req.user.shopCode;

    const totalMedicines = await Medicine.countDocuments({ pharmacyId });
    const totalOrders = await Order.countDocuments({ pharmacyId });
    const deliveredOrders = await Order.countDocuments({ pharmacyId, status: 'Delivered' });
    const pendingOrders = await Order.countDocuments({ 
      pharmacyId, 
      status: { $in: ['Pending', 'Confirmed', 'Preparing', 'Ready'] } 
    });

    const totalRevenue = await Order.aggregate([
      { $match: { pharmacyId } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const recentOrders = await Order.find({ pharmacyId })
      .sort({ createdAt: -1 })
      .limit(6);

    const lowStockMedicines = await Medicine.find({
      pharmacyId,
      stock: { $lt: 50 }
    }).sort({ stock: 1 });

    const medicineStats = await Order.aggregate([
      { $match: { pharmacyId } },
      { $unwind: '$items' },
      { $group: { _id: '$items.medicine', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalMedicines,
          totalOrders,
          deliveredOrders,
          pendingOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recentOrders,
        lowStockMedicines,
        medicineStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/customer
// @desc    Get customer dashboard stats
// @access  Private - 'customer'
router.get('/customer', protect, authorize('customer'), async (req: AuthRequest, res: Response) => {
  try {
    const totalOrders = await Order.countDocuments({ customerEmail: req.user.email });
    const deliveredOrders = await Order.countDocuments({ 
      customerEmail: req.user.email, 
      status: 'Delivered' 
    });
    const pendingOrders = await Order.countDocuments({ 
      customerEmail: req.user.email, 
      status: { $in: ['Pending', 'Confirmed', 'Preparing', 'Ready'] } 
    });

    const totalSpent = await Order.aggregate([
      { $match: { customerEmail: req.user.email } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const recentOrders = await Order.find({ customerEmail: req.user.email })
      .populate('items.medicine')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          deliveredOrders,
          pendingOrders,
          totalSpent: totalSpent[0]?.total || 0
        },
        recentOrders
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data
// @access  Private - 'admin' or 'owner'
router.get('/analytics', protect, authorize('admin', 'owner'), async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    let query: any = { createdAt: { $gte: daysAgo } };
    
    if (req.user.role === 'owner') {
      query.pharmacyId = req.user.shopCode;
    }

    const dailyOrders = await Order.aggregate([
      { $match: query },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$total' }
      }},
      { $sort: { _id: 1 } }
    ]);

    const ordersByStatus = await Order.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topCategories = await Order.aggregate([
      { $match: query },
      { $unwind: '$items' },
      { $lookup: {
        from: 'medicines',
        localField: 'items.medicine',
        foreignField: '_id',
        as: 'medicine'
      }},
      { $unwind: '$medicine' },
      { $group: { 
        _id: '$medicine.category', 
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$medicine.price', '$items.quantity'] } }
      }},
      { $sort: { totalSold: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        dailyOrders,
        ordersByStatus,
        topCategories
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
