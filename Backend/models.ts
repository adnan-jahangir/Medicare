import mongoose from 'mongoose';

// 1. User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'owner', 'admin', 'driver', 'pharmacy', 'vendor', 'shop_owner'], default: 'customer' },
  phoneNumber: String,
  profilePhoto: String,
  rating: { type: Number, default: 0 },
  shopCode: String,
  shopName: String,
  shopLocation: String,
  shopLicense: String,
  
  // Driver specific fields
  isApproved: { type: Boolean, default: false },
  vehicleType: { type: String, enum: ['Bicycle', 'Motorbike', 'Scooter'] },
  licensePlate: String,
  nidNumber: String,
  nidFront: String,
  nidBack: String,
  drivingLicense: String,
  zone: String,
  address: String,
  wallet: { type: Number, default: 0 },

  last_login: Date,
}, { timestamps: true });

// 2. Pharmacy Schema
const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  rating: { type: Number, default: 0 },
  ownerName: String,
  monthlyRevenue: { type: Number, default: 0 },
  location: {
    lat: { type: Number, default: 22.3568 }, // Default Chittagong
    lng: { type: Number, default: 91.7832 }
  }
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

// 4. Order Schema (Includes Nested Items, Payment Info and Live Tracking)
const orderSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  customerEmail: { type: String, required: true },
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed'], 
    default: 'Pending' 
  },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  tranId: String,

  // Nested Items
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    quantity: { type: Number, required: true }
  }],
  
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived', 'Delivered', 'Completed', 'Cancelled'],
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
  deliveryAddress: {
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
  },
  otp: String,
  otpExpiresAt: Date
}, { timestamps: true });

// Export Models
export const User = mongoose.model('User', userSchema);
export const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
export const Medicine = mongoose.model('Medicine', medicineSchema);
export const Order = mongoose.model('Order', orderSchema);