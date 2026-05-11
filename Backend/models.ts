import mongoose from 'mongoose';

// 1. User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'owner', 'admin', 'driver'], default: 'customer' },
  shopCode: String,
  shopName: String,
  shopLocation: String,
  last_login: Date,
}, { timestamps: true });

// 2. Pharmacy Schema
const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  rating: { type: Number, default: 0 },
  ownerName: String,
  monthlyRevenue: { type: Number, default: 0 }
}, { timestamps: true });

// 3. Medicine Schema
const medicineSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  name: { type: String, required: true },
  brand: String,
  strength: String,
  dosage: String,
  description: String,
  category: { 
    type: String, 
    enum: ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu', 'Digestive', 'Diabetes', 'Heart', 'Skin Care'] 
  },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: String,
  prescriptionRequired: { type: Boolean, default: false }
}, { timestamps: true });

// 4. Order Schema (Includes Nested Items and Live Tracking)
const orderSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  customerEmail: { type: String, required: true },
  
  // Nested Items
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    quantity: { type: Number, required: true }
  }],
  
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered'],
    default: 'Pending'
  },
  
  // Route Map Coords
  pickup: {
    lat: Number,
    lng: Number
  },
  destination: {
    lat: Number,
    lng: Number
  },
  
  // Live Tracking mapped fields
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverProgress: { type: Number, default: 0 },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  }
}, { timestamps: true });

// Export Models
export const User = mongoose.model('User', userSchema);
export const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
export const Medicine = mongoose.model('Medicine', medicineSchema);
export const Order = mongoose.model('Order', orderSchema);