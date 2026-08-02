import connectDB from './db.js';
import { Order, Medicine } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  try {
    await connectDB();
    console.log('Database connected.');

    // 1. Delete all orders
    const deleteOrdersResult = await Order.deleteMany({});
    console.log(`Successfully deleted ${deleteOrdersResult.deletedCount} orders.`);

    // 2. Reset stock of all medicines to 100 to start fresh
    const resetStockResult = await Medicine.updateMany({}, { $set: { stock: 100 } });
    console.log(`Reset stock for ${resetStockResult.modifiedCount} medicines to 100.`);

    console.log('All orders cleared and stocks reset. Ready to start fresh!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
