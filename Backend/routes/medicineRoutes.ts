import express, { Response } from "express";
import { Medicine, Pharmacy } from "../models.js";
import { protect, authorize, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/medicines
// @desc    Get all medicines (Optional filter by ?pharmacyId=..., ?category=..., ?search=...)
// @access  Public
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      pharmacyId,
      category,
      search,
      minPrice,
      maxPrice,
      prescriptionOnly,
      sort,
    } = req.query;
    let query: any = {};

    if (pharmacyId) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(pharmacyId as string);
      if (isValidObjectId) {
        query.pharmacyId = pharmacyId;
      }
    }
    if (category) query.category = category;
    if (prescriptionOnly) query.prescriptionRequired = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    // Search by name, brand, or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let queryBuilder = Medicine.find(query).populate(
      "pharmacyId",
      "name city rating",
    );

    // Sorting
    if (sort === "price-asc") {
      queryBuilder = queryBuilder.sort({ price: 1 });
    } else if (sort === "price-desc") {
      queryBuilder = queryBuilder.sort({ price: -1 });
    } else if (sort === "newest") {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    const medicines = await queryBuilder;

    res.json(medicines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/medicines/:id
// @desc    Get single medicine by ID
// @access  Public
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate(
      "pharmacyId",
      "name city rating",
    );

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({
      success: true,
      data: medicine,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/medicines
// @desc    Add a new medicine
// @access  Private - 'owner' or 'admin'
router.post(
  "/",
  protect,
  authorize("owner", "admin", "pharmacy", "vendor", "shop_owner"),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        brand,
        strength,
        dosage,
        description,
        category,
        price,
        stock,
        image,
        prescriptionRequired,
        pharmacyId,
      } = req.body;

      if (!name || !price || !pharmacyId) {
        return res
          .status(400)
          .json({ message: "Name, price, and pharmacyId are required" });
      }

      if (price < 0) {
        return res.status(400).json({ message: "Price cannot be negative" });
      }

      const medicine = new Medicine({
        pharmacyId,
        name,
        brand,
        strength,
        dosage,
        description,
        category,
        price,
        stock: stock || 0,
        image,
        prescriptionRequired: prescriptionRequired || false,
      });

      const savedMedicine = await medicine.save();
      const populatedMedicine = await Medicine.findById(
        savedMedicine._id,
      ).populate("pharmacyId", "name city");

      res.status(201).json({
        success: true,
        message: "Medicine created successfully",
        data: populatedMedicine,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
);

// @route   POST /api/medicines/bulk
// @desc    Bulk add medicines (array).
// @access  Private - 'owner' or 'admin'
router.post(
  "/bulk",
  protect,
  authorize("owner", "admin", "pharmacy", "vendor", "shop_owner"),
  async (req: AuthRequest, res: Response) => {
    try {
      const payload = req.body;

      if (!Array.isArray(payload) || payload.length === 0) {
        return res.status(400).json({ message: "Expected a non-empty array" });
      }

      // Determine pharmacy: accept query param pharmacyId or fallback to Central Pharmacy
      let pharmacyId = req.query.pharmacyId as string | undefined;
      let pharmacy;
      if (pharmacyId) {
        pharmacy = await Pharmacy.findById(pharmacyId);
      } else {
        pharmacy = await Pharmacy.findOne({ name: "MedeCare Pharmacy" });
        if (!pharmacy) {
          pharmacy = await Pharmacy.create({ name: "MedeCare Pharmacy", city: "Chittagong", rating: 4.8 });
        }
        pharmacyId = pharmacy._id.toString();
      }

      const inserted: any[] = [];
      const skipped: any[] = [];

      for (const item of payload) {
        const name = item.medicineName || item.name;
        if (!name || !item.price) {
          skipped.push({ item, reason: "missing name or price" });
          continue;
        }

        const exists = await Medicine.findOne({ name, pharmacyId });
        if (exists) {
          skipped.push({ name, reason: "already exists" });
          continue;
        }

        const med = new Medicine({
          pharmacyId,
          name,
          brand: item.brandName || item.brand,
          strength: item.strength,
          dosage: item.dosage,
          description: item.description,
          category: item.category,
          price: Number(item.price),
          stock: item.stock || 100,
          image: item.imageUrl || item.image,
          prescriptionRequired: typeof item.prescriptionRequired === 'boolean' ? item.prescriptionRequired : ['Antibiotics','Diabetes','Heart'].includes(item.category),
        });

        await med.save();
        inserted.push(med);
      }

      res.status(201).json({ success: true, insertedCount: inserted.length, skippedCount: skipped.length, skipped, inserted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @route   PATCH /api/medicines/:id
// @desc    Update a medicine (price, stock, etc.)
// @access  Private - 'owner' or 'admin'
router.patch(
  "/:id",
  protect,
  authorize("owner", "admin", "pharmacy", "vendor", "shop_owner"),
  async (req: AuthRequest, res: Response) => {
    try {
      const medicine = await Medicine.findById(req.params.id);

      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      // Optionally check if shop owner actually owns this pharmacy here...

      const updatedMedicine = await Medicine.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }, // new: returns updated doc, runValidators ensures data matches schema
      );

      res.json({
        success: true,
        message: "Medicine updated successfully",
        data: updatedMedicine,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
);

// @route   DELETE /api/medicines/:id
// @desc    Delete a medicine
// @access  Private - 'owner' or 'admin'
router.delete(
  "/:id",
  protect,
  authorize("owner", "admin", "pharmacy", "vendor", "shop_owner"),
  async (req: AuthRequest, res: Response) => {
    try {
      const medicine = await Medicine.findById(req.params.id);

      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      await Medicine.findByIdAndDelete(req.params.id);
      res.json({
        success: true,
        message: "Medicine removed successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @route   GET /api/medicines/category/:category
// @desc    Get medicines by category
// @access  Public
router.get("/category/:category", async (req: AuthRequest, res: Response) => {
  try {
    const medicines = await Medicine.find({ category: req.params.category })
      .populate("pharmacyId", "name city")
      .sort({ createdAt: -1 });

    res.json(medicines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
