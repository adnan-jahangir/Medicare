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

// Rate limiter for login to mitigate brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes to prevent brute-force
  message: { message: "Too many login attempts, please try again after 15 minutes" },
});

// Joi validation schemas (ADMIN is explicitly disallowed from public registration)
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("customer", "owner", "driver", "pharmacy", "vendor", "shop_owner").optional(),
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

    // Security Check: Disallow admin role creation through public registration
    if (role === "admin" || (req.body.role && String(req.body.role).toLowerCase() === "admin")) {
      return res.status(403).json({ message: "Admin accounts cannot be registered publicly." });
    }

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

    const assignedRole = role || "customer";

    // 3. Create User (Drivers require admin approval before dispatching)
    const user = await User.create({
      name,
      email,
      password_hash,
      role: assignedRole,
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
      isApproved: assignedRole === 'driver' ? false : true
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

    // Driver static demo login
    const driverEmail = (process.env.DRIVER_EMAIL || 'driver@medicare.com').trim().toLowerCase();
    const driverPassword = process.env.DRIVER_PASSWORD || 'driver123';

    if (inputEmail === driverEmail && password === driverPassword) {
      let driverUser = await User.findOne({ email: driverEmail });
      if (!driverUser) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        driverUser = await User.create({
          name: "MedeCare Courier",
          email: driverEmail,
          password_hash,
          role: "driver",
          vehicleType: "Motorbike",
          phoneNumber: "+8801812345678",
          licensePlate: "CTG-HA-5678",
          nidNumber: "1997234567890",
          zone: "Chittagong Central",
          isApproved: true,
          wallet: 150
        });
      } else {
        driverUser.isApproved = true;
      }
      driverUser.last_login = new Date();
      await driverUser.save();

      return res.json({
        success: true,
        message: "Driver login successful",
        data: {
          id: driverUser._id.toString(),
          _id: driverUser._id,
          name: driverUser.name,
          email: driverUser.email,
          role: driverUser.role,
          wallet: driverUser.wallet,
          token: generateToken(driverUser._id.toString(), driverUser.role),
        },
      });
    }

    // Customer static demo login
    const customerEmail = (process.env.CUSTOMER_EMAIL || 'customer@medicare.com').trim().toLowerCase();
    const customerPassword = process.env.CUSTOMER_PASSWORD || 'customer123';

    if (inputEmail === customerEmail && password === customerPassword) {
      let customerUser = await User.findOne({ email: customerEmail });
      if (!customerUser) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        customerUser = await User.create({
          name: "Demo Customer",
          email: customerEmail,
          password_hash,
          role: "customer",
          phoneNumber: "+8801712345678",
          address: "GEC Circle, Chittagong",
          wallet: 0
        });
      }
      customerUser.last_login = new Date();
      await customerUser.save();

      return res.json({
        success: true,
        message: "Customer login successful",
        data: {
          id: customerUser._id.toString(),
          _id: customerUser._id,
          name: customerUser.name,
          email: customerUser.email,
          role: customerUser.role,
          token: generateToken(customerUser._id.toString(), customerUser.role),
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
      // 3. Check driver status (auto-approve drivers so they can test/use the app without block)
      if (user.role === 'driver' && !user.isApproved) {
        user.isApproved = true;
        await user.save();
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
