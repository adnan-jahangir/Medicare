import express, { Response } from 'express';
import { User } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all drivers needing approval
// @access  Private - 'admin'
router.get('/pending-drivers', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await User.find({ role: 'driver', isApproved: false }).select('-password_hash');
    res.json({ success: true, data: drivers });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve or Reject driver
// @access  Private - 'admin'
router.patch('/approve-driver/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { approve } = req.body; // true to approve, false to delete/reject
    
    if (approve) {
      const driver = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      res.json({ success: true, message: 'Driver approved successfully!', data: driver });
    } else {
      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Driver registration rejected and deleted.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
