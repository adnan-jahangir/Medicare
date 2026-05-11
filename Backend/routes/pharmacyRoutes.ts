import express, { Response } from 'express';
import { Pharmacy } from '../models.js';
import { protect, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/pharmacies
// @desc    Get all pharmacies
// @access  Public
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { city, rating, sort } = req.query;
    let query: any = {};

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating as string) };
    }

    const pharmacies = await Pharmacy.find(query).sort(
      sort === 'revenue' ? { monthlyRevenue: -1 } : { rating: -1 }
    );

    res.json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/pharmacies/:id
// @desc    Get pharmacy by ID
// @access  Public
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      data: pharmacy
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/pharmacies
// @desc    Create a new pharmacy
// @access  Private - 'admin' or 'owner'
router.post('/', protect, authorize('admin', 'owner'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, city, ownerName } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: 'Name and city are required' });
    }

    const pharmacy = new Pharmacy({
      name,
      city,
      ownerName: ownerName || req.user.name,
      rating: 0,
      monthlyRevenue: 0
    });

    const savedPharmacy = await pharmacy.save();

    res.status(201).json({
      success: true,
      message: 'Pharmacy created successfully',
      data: savedPharmacy
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/pharmacies/:id
// @desc    Update pharmacy information
// @access  Private - 'admin' or 'owner'
router.patch('/:id', protect, authorize('admin', 'owner'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, city, rating, ownerName, monthlyRevenue } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (city) updateData.city = city;
    if (rating !== undefined) updateData.rating = Math.min(5, Math.max(0, rating));
    if (ownerName) updateData.ownerName = ownerName;
    if (monthlyRevenue !== undefined) updateData.monthlyRevenue = monthlyRevenue;

    const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      message: 'Pharmacy updated successfully',
      data: updatedPharmacy
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/pharmacies/:id
// @desc    Delete a pharmacy
// @access  Private - 'admin'
router.delete('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    await Pharmacy.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Pharmacy deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
