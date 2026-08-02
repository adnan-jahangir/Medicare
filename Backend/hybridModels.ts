import mongoose, { Schema, Document } from 'mongoose';

/**
 * PRODUCTION-GRADE HYBRID DATABASE MODELS (MONGODB GEOSPATIAL & UNSTRUCTURED)
 */

// --- 1. Pharmacies Collection (Geospatial) ---
export interface IPharmacyGeo extends Document {
  pharmacyId: string; // Foreign Key to Relational DB
  name: string;
  address: string;
  status: 'Active' | 'Inactive';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [Longitude, Latitude]
  };
}

const PharmacyGeoSchema = new Schema<IPharmacyGeo>({
  pharmacyId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
}, { timestamps: true });

// CRITICAL: 2dsphere index for geospatial queries
PharmacyGeoSchema.index({ location: '2dsphere' });

export const PharmacyGeo = mongoose.model<IPharmacyGeo>('PharmacyGeo', PharmacyGeoSchema);


// --- 2. Live Deliveries & Tracking Collection ---
export interface ILiveDelivery extends Document {
  deliveryId: string;
  orderId: string;
  driverId: string;
  status: 'Driver Assigned' | 'Picked Up' | 'On the Way' | 'Arrived' | 'Completed';
  otpCode?: string;
  currentLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  lastUpdated: Date;
}

const LiveDeliverySchema = new Schema<ILiveDelivery>({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true, index: true },
  driverId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['Driver Assigned', 'Picked Up', 'On the Way', 'Arrived', 'Completed'],
    required: true
  },
  otpCode: String,
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

LiveDeliverySchema.index({ currentLocation: '2dsphere' });

export const LiveDelivery = mongoose.model<ILiveDelivery>('LiveDelivery', LiveDeliverySchema);


// --- 3. Prescriptions Collection (Unstructured / OCR) ---
export interface IPrescription extends Document {
  prescriptionId: string;
  orderId?: string;
  customerId: string;
  imageUrl: string;
  extractedText: string;
  detectedMedicines: string[];
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

const PrescriptionSchema = new Schema<IPrescription>({
  prescriptionId: { type: String, required: true, unique: true },
  orderId: String,
  customerId: { type: String, required: true, index: true },
  imageUrl: { type: String, required: true },
  extractedText: { type: String, required: true },
  detectedMedicines: [String],
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

// CRITICAL: Text index for fuzzy keyword matching in extracted text
PrescriptionSchema.index({ extractedText: 'text' });
PrescriptionSchema.index({ detectedMedicines: 1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);


/**
 * CONTROLLER LOGIC (PRODUCTION-GRADE)
 */

import { Request, Response } from 'express';

/**
 * GET NEARBY PHARMACIES
 * Uses MongoDB $nearSphere to find stores within a radius
 * Request params: lat, lng, maxDistance (meters)
 */
export const getNearbyPharmacies = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const maxDistance = parseInt(req.query.maxDistance as string) || 5000; // Default 5km

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    const pharmacies = await PharmacyGeo.find({
      status: 'Active',
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // [Longitude, Latitude] is mandatory in GeoJSON
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(20);

    res.json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPSERT DRIVER POSITION
 * To be called via API or integrated into a Socket.io event handler
 */
export const updateDriverLocation = async (deliveryId: string, lat: number, lng: number, status?: string) => {
  try {
    const update: any = {
      currentLocation: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      lastUpdated: new Date()
    };

    if (status) update.status = status;

    const result = await LiveDelivery.findOneAndUpdate(
      { deliveryId },
      { $set: update },
      { upsert: true, new: true }
    );

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to update tracking info:', error);
    return { success: false, message: error.message };
  }
};

/**
 * SEARCH PRESCRIPTIONS
 * Uses Text Index to search handwritten/OCR text
 */
export const searchPrescriptions = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query required' });

    const prescriptions = await Prescription.find(
      { $text: { $search: query as string } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10);

    res.json({ success: true, data: prescriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
