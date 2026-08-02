import connectDB from './db.js';
import { Order, Pharmacy } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
  console.log('Checking orders...');
  const totalOrders = await Order.countDocuments();
  console.log('Total orders:', totalOrders);

  const medicare = await Pharmacy.findOne({ name: 'Medicare pharmacy' });
  if (!medicare) {
    console.log('Medicare pharmacy not found');
    process.exit(1);
  }
  
  const orderCounts = await Order.aggregate([{ $group: { _id: '$pharmacyId', count: { $sum: 1 } } }]);
  console.log('Orders by pharmacyId:', orderCounts);

  // Update all orders to Medicare pharmacy so the owner can see them
  const updateRes = await Order.updateMany({}, { $set: { pharmacyId: medicare._id } });
  console.log('Orders migrated to Medicare Pharmacy:', updateRes.modifiedCount);

  process.exit(0);
}).catch(console.error);
