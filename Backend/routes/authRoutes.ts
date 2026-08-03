import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User, Pharmacy } from "../models.js";
import { protect, AuthRequest } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import Joi from "joi";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  max: 1000, // Increased for development
  message: { message: "Too many login attempts, please try again later" },
});

// Joi validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("customer", "owner", "admin", "driver", "pharmacy", "vendor", "shop_owner").optional(),
  shopCode: Joi.string().optional().allow('').empty(''),
  shopName: Joi.string().optional().allow('').empty(''),
  shopLocation: Joi.string().optional().allow('').empty(''),
  shopLicense: Joi.string().optional().allow('').empty(''),
  shopOwnerName: Joi.string().optional().allow('').empty(''),
  phoneNumber: Joi.string().optional().allow('').empty(''),
  address: Joi.string().optional().allow('').empty(''),
  // Driver specific
  vehicleType: Joi.string().valid('Bicycle', 'Motorbike', 'Scooter').optional(),
  licensePlate: Joi.string().optional().allow('').empty(''),
  nidNumber: Joi.string().optional().allow('').empty(''),
  zone: Joi.string().optional().allow('').empty(''),
});

const loginSchema = Joi.object({
  email: Joi.string().required(), // Now accepts either email or shopCode
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

    const { name, email, password, role, shopCode, shopName, shopLocation, shopLicense, vehicleType, licensePlate, nidNumber, zone, phoneNumber, address } =
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
      shopLicense,
      phoneNumber,
      address,
      // Driver fields
      vehicleType,
      licensePlate,
      nidNumber,
      zone,
      isApproved: (role === 'driver') ? false : true // Only drivers need approval
    });

    // 4. Return successful response with token
    if (user) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: user._id.toString(),
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

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@medicare.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const ownerEmail = (process.env.OWNER_EMAIL || 'owner@medicare.com').trim().toLowerCase();
    const ownerPassword = process.env.OWNER_PASSWORD || 'owner123';
    const inputEmail = (email || '').trim().toLowerCase();

    // Admin static login bypass
    if (inputEmail === adminEmail && password === adminPassword) {
      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        adminUser = await User.create({
          name: "System Admin",
          email: adminEmail,
          password_hash,
          role: "admin",
          isApproved: true
        });
      }
      adminUser.last_login = new Date();
      await adminUser.save();

      return res.json({
        success: true,
        message: "Admin login successful",
        data: {
          id: adminUser._id.toString(),
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          token: generateToken(adminUser._id.toString(), adminUser.role),
        },
      });
    }

    // Owner static login bypass
    if (inputEmail === ownerEmail && password === ownerPassword) {
      let pharmacy = await Pharmacy.findOne({ name: "Medicare pharmacy" });
      if (!pharmacy) {
        pharmacy = await Pharmacy.create({
          name: "Medicare pharmacy",
          city: "Chittagong",
          rating: 4.8,
          location: { lat: 22.3568, lng: 91.7832 }
        });
      }

      let ownerUser = await User.findOne({ email: ownerEmail });
      if (!ownerUser) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        ownerUser = await User.create({
          name: "Shop Owner",
          email: ownerEmail,
          password_hash,
          role: "owner",
          shopCode: pharmacy._id.toString(),
          shopName: "Medicare pharmacy",
          shopLocation: "GEC.Chittagong Bangladesh",
          isApproved: true
        });
      } else if (ownerUser.shopCode === "MED-001") {
        ownerUser.shopCode = pharmacy._id.toString();
      }
      
      ownerUser.last_login = new Date();
      await ownerUser.save();

      return res.json({
        success: true,
        message: "Owner login successful",
        data: {
          id: ownerUser._id.toString(),
          _id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email,
          role: ownerUser.role,
          shopCode: ownerUser.shopCode,
          shopName: ownerUser.shopName,
          token: generateToken(ownerUser._id.toString(), ownerUser.role),
        },
      });
    }

    // 1. Find user by email or shopCode or phoneNumber
    const user: any = await User.findOne({ 
      $or: [
        { email: email },
        { shopCode: email },
        { phoneNumber: email }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      // 3. Check if driver is approved
      if (user.role === 'driver' && !user.isApproved) {
        return res.status(403).json({ message: "Your account is pending admin approval." });
      }

      // Update last_login timestamp and fix legacy shopCode
      user.last_login = new Date();
      if (user.role === 'owner' && user.shopCode === 'MED-001') {
        let pharmacy = await Pharmacy.findOne({ name: "Medicare pharmacy" });
        if (!pharmacy) {
          pharmacy = await Pharmacy.create({
            name: "Medicare pharmacy",
            city: "Chittagong",
            rating: 4.8,
            location: { lat: 22.3568, lng: 91.7832 }
          });
        }
        user.shopCode = pharmacy._id.toString();
      }
      await user.save();

      // Return user data and token
      res.json({
        success: true,
        message: "Login successful",
        data: {
          id: user._id.toString(),
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

import axios from "axios";

// @route   POST /api/auth/google
// @desc    Auth user with Google & get token
// @access  Public
router.post("/google", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "No Google token provided" });

    // Use access token to get user profile
    const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { email, name } = googleRes.data;
    if (!email) return res.status(400).json({ message: "Google account has no email" });

    // Check if user exists
    let user: any = await User.findOne({ email });

    if (!user) {
      // Create new user (default to customer)
      user = await User.create({
        name: name || "Google User",
        email: email,
        password_hash: await bcrypt.hash(Math.random().toString(36).slice(-10), 10), // Random password
        role: "customer",
        isApproved: true,
      });
    }

    user.last_login = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Google login successful",
      data: {
        id: user._id.toString(),
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopCode: user.shopCode,
        shopName: user.shopName,
        token: generateToken(user._id.toString(), user.role),
      },
    });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

export default router;
