import mongoose from 'mongoose';
import connectDB from './db.js';
import dotenv from 'dotenv';
import { User, Pharmacy, Medicine } from './models.js';

dotenv.config();

const CATEGORIES = [
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Cold & Flu',
  'Digestive',
  'Diabetes',
  'Heart',
  'Skin Care',
];

function generateMedicinesForCategory(category: string, count = 15) {
  const dosages = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Drop'];
  const meds: any[] = [];

  for (let i = 1; i <= count; i++) {
    const short = category.replace(/[^a-zA-Z0-9]/g, '') || 'Med';
    const name = `${category} Sample ${i}`;
    const brand = `${short}Brand${i}`;
    const strength = category === 'Vitamins' ? `${(i % 5 + 1) * 400} IU` : `${(i % 10 + 1) * 50} mg`;
    const dosage = dosages[i % dosages.length];
    const description = `${name} — sample entry for ${category}`;
    const image = `https://via.placeholder.com/300.png?text=${encodeURIComponent(name)}`;
    const price = Math.max(5, Math.round(Math.random() * 200));
    const stock = Math.floor(Math.random() * 200) + 10;
    const prescriptionRequired = ['Antibiotics', 'Diabetes', 'Heart'].includes(category);

    meds.push({
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
    });
  }

  return meds;
}

const seed = async () => {
  await connectDB();

  // Ensure admin user exists
  const existingAdmin = await User.findOne({ email: 'admin@medicare.com' });
  if (!existingAdmin) {
    const user = new User({
      name: 'Admin Admin',
      email: 'admin@medicare.com',
      password_hash: 'temporay-hash-12345',
      role: 'admin',
    });
    await user.save();
    console.log('Admin user saved!');
  } else {
    console.log('Admin user already exists.');
  }

  // Find or create sample pharmacy
  const pharmacyName = 'MedeCare Pharmacy';
  let pharmacy = await Pharmacy.findOne({ name: pharmacyName });
  if (!pharmacy) {
    pharmacy = new Pharmacy({
      name: pharmacyName,
      city: 'Chittagong',
      rating: 4.8,
      ownerName: 'MedeCare Owner',
      monthlyRevenue: 0,
    });
    await pharmacy.save();
    console.log('Pharmacy created with id:', pharmacy._id.toString());
  } else {
    console.log('Pharmacy exists with id:', pharmacy._id.toString());
  }

  // For each category, generate and insert medicines if they don't already exist
  for (const category of CATEGORIES) {
    const meds = generateMedicinesForCategory(category, 15).map((m) => ({
      ...m,
      pharmacyId: pharmacy!._id,
    }));

    for (const med of meds) {
      const exists = await Medicine.findOne({ name: med.name, pharmacyId: pharmacy!._id });
      if (!exists) {
        await Medicine.create(med);
        console.log('Inserted medicine:', med.name);
      } else {
        console.log('Skipped existing medicine:', med.name);
      }
    }
  }

  console.log('Bulk seeding complete.');
  process.exit();
};

seed();