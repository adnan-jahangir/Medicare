import connectDB from './db.js';
import { Order, Pharmacy, Medicine, User } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

async function createDemoOrder() {
  try {
    await connectDB();
    console.log('Database connected.');

    // 1. Get or create Medicare Pharmacy in Chittagong
    let pharmacy = await Pharmacy.findOne({ name: 'Medicare pharmacy' });
    if (!pharmacy) {
      pharmacy = await Pharmacy.create({
        name: 'Medicare pharmacy',
        city: 'Chittagong',
        rating: 4.8,
        location: { lat: 22.3568, lng: 91.7832 },
      });
    } else {
      pharmacy.location = { lat: 22.3568, lng: 91.7832 };
      await pharmacy.save();
    }

    // 2. Get active driver
    const driver = await User.findOne({ role: 'driver' });
    if (!driver) {
      console.log('No driver found');
      process.exit(1);
    }

    // 3. Get or create sample medicine
    let medicine = await Medicine.findOne({ pharmacyId: pharmacy._id });
    if (!medicine) {
      medicine = await Medicine.create({
        pharmacyId: pharmacy._id,
        name: 'Paracetamol 500mg',
        price: 15,
        stock: 100,
      });
    }

    // 4. Create fresh active order assigned to driver
    const order = new Order({
      pharmacyId: pharmacy._id,
      customerEmail: 'customer@medicare.com',
      customerName: 'Kazi Adnan',
      customerPhone: '+8801700000000',
      items: [{ medicine: medicine._id, quantity: 2 }],
      total: 30,
      status: 'On the Way', // Active delivery status
      driverId: driver._id,
      driverProgress: 0, // Reset progress to 0%
      pickup: {
        lat: 22.3568, // GEC Chittagong
        lng: 91.7832,
      },
      destination: {
        lat: 22.3648, // Chittagong Medical / 1 km away
        lng: 91.8012,
      },
      deliveryAddress: {
        lat: 22.3648,
        lng: 91.8012,
      },
      currentLocation: {
        lat: 22.3568,
        lng: 91.7832,
        updatedAt: new Date(),
      },
      otp: '1234',
    });

    await order.save();
    console.log(`Demo Order created successfully for driver ${driver.name} (${driver.email})! Order ID: ${order._id}`);

    // Update all other drivers in DB to also be assigned to this order if needed
    await Order.updateMany({ _id: order._id }, { $set: { driverId: driver._id } });

    process.exit(0);
  } catch (err) {
    console.error('Error creating demo order:', err);
    process.exit(1);
  }
}

createDemoOrder();
