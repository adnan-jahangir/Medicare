import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const data = JSON.parse(fs.readFileSync('./data/user_medicines.json', 'utf8'));
  const Medicine = mongoose.model('Medicine', new mongoose.Schema({ name: String, image: String }, { strict: false }));
  
  let updated = 0;
  for (const item of data) {
    if (item.image_url) {
      const result = await Medicine.updateMany({ name: item.name }, { $set: { image: item.image_url } });
      updated += result.modifiedCount;
    }
  }
  console.log('Updated ' + updated + ' medicines with real image URLs.');
  process.exit(0);
}
run();
