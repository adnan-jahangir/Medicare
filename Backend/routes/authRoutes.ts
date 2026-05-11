import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models.js";
import { protect, AuthRequest } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import Joi from "joi";

const router = express.Router();

// Helper to generate JWT token
const generateToken = (id: string, role: string) => {
  const secret = process.env.JWT_SECRET || "secret123";
  return jwt.sign({ id, role }, secret, {
    expiresIn: "30d",
  });
};

// Rate limiter for login to mitigate brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6,
  message: { message: "Too many login attempts, please try again later" },
});

// Joi validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("customer", "owner", "admin", "driver").optional(),
  shopCode: Joi.string().optional().allow('').empty(''),
  shopName: Joi.string().optional().allow('').empty(''),
  shopLocation: Joi.string().optional().allow('').empty(''),
  shopOwnerName: Joi.string().optional().allow('').empty(''),
  phoneNumber: Joi.string().optional().allow('').empty(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, role, shopCode, shopName, shopLocation } =
      value as any;

    // 1. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = await User.create({
      name,
      email,
      password_hash,
      role: role || "customer",
      shopCode,
      shopName,
      shopLocation,
    });

    // 4. Return successful response with token
    if (user) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id.toString(), user.role),
        },
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = value as any;

    // 1. Find user by email
    const user: any = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      // Update last_login timestamp
      user.last_login = new Date();
      await user.save();

      // Return user data and token
      res.json({
        success: true,
        message: "Login successful",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopCode: user.shopCode,
          shopName: user.shopName,
          token: generateToken(user._id.toString(), user.role),
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify current token and get user info
// @access  Private
router.get("/verify", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select("-password_hash");

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
