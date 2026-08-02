import fs from 'fs';
import path from 'path';
import connectDB from './db.js';
import { Medicine, Pharmacy } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await connectDB();
  const rawData = fs.readFileSync(path.join(process.cwd(), 'data', 'user_medicines.json'), 'utf-8');
  const data = JSON.parse(rawData);
  const medicines = Array.isArray(data) ? data : data.medicines;
  
  await Medicine.deleteMany({});
  console.log('Cleared previous medicines.');
  
  let pharmacy = await Pharmacy.findOne({ name: 'Central Pharmacy' });
  if (!pharmacy) {
    pharmacy = await Pharmacy.create({ name: 'Central Pharmacy', city: 'Karachi', rating: 4.6 });
  }

  for (const item of medicines) {
    const med = new Medicine({
      pharmacyId: pharmacy._id,
      name: item.name,
      brand: item.brand,
      strength: item.strength,
      dosage: item.dosage,
      description: item.description,
      category: item.category,
      price: Number(item.price),
      stock: item.stock || 100,
      image: item.image_url,
      prescriptionRequired: item.requires_prescription,
    });
    await med.save();
    console.log('Inserted:', med.name);
  }

  console.log('Import complete.');
  process.exit();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
