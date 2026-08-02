import connectDB from './db.js';
import { Medicine, Pharmacy, User } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
  console.log('Starting DB fix...');
  
  // 1. Get Medicare pharmacy
  const medicare = await Pharmacy.findOne({ name: 'Medicare pharmacy' });
  if (!medicare) {
    console.log('Medicare pharmacy not found');
    process.exit(1);
  }
  console.log('Medicare Pharmacy ID:', medicare._id);

  // 2. Fix owner shopCode
  const owner = await User.findOne({ role: 'owner' });
  if (owner) {
    console.log(`Updating owner shopCode from ${owner.shopCode} to ${medicare._id}`);
    owner.shopCode = medicare._id.toString();
    await owner.save();
    console.log('Owner updated.');
  }

  // 3. Move all medicines to Medicare pharmacy
  const updateRes = await Medicine.updateMany({}, { $set: { pharmacyId: medicare._id } });
  console.log('Medicines updated:', updateRes.modifiedCount);

  process.exit(0);
}).catch(console.error);
