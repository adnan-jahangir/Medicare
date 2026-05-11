import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.patch('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, shopCode, shopName, shopLocation } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (shopCode) updateData.shopCode = shopCode;
    if (shopName) updateData.shopName = shopName;
    if (shopLocation) updateData.shopLocation = shopLocation;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password_hash');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/users/change-password
// @desc    Change user's password
// @access  Private
router.patch('/change-password', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user: any = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    user.password_hash = password_hash;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private - 'admin'
router.get('/', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { role, status } = req.query;
    let query: any = {};

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password_hash').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private - 'admin'
router.get('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/users/:id
// @desc    Update user (admin only)
// @access  Private - 'admin'
router.patch('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, shopCode, shopName, shopLocation } = req.body;

    if (role && !['customer', 'owner', 'admin', 'driver'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (shopCode) updateData.shopCode = shopCode;
    if (shopName) updateData.shopName = shopName;
    if (shopLocation) updateData.shopLocation = shopLocation;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private - 'admin'
router.delete('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
