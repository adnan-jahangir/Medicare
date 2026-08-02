import connectDB from './db.js';
import { Order, Pharmacy, Medicine, User } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

async function createDemoOrderForEveryDriver() {
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
    }

    // 2. Get all drivers
    const drivers = await User.find({ role: 'driver' });
    console.log(`Found ${drivers.length} drivers.`);

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

    // 4. Create an active order for EACH driver so every login works instantly
    for (const d of drivers) {
      const existing = await Order.findOne({
        driverId: d._id,
        status: { $in: ['Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'] },
      });

      if (!existing) {
        const order = new Order({
          pharmacyId: pharmacy._id,
          customerEmail: 'customer@medicare.com',
          customerName: 'Kazi Adnan',
          customerPhone: '+8801700000000',
          items: [{ medicine: medicine._id, quantity: 2 }],
          total: 30,
          status: 'On the Way',
          driverId: d._id,
          driverProgress: 0,
          pickup: {
            lat: 22.3568, // GEC Chittagong
            lng: 91.7832,
          },
          destination: {
            lat: 22.3648, // Chittagong Medical (1 km away)
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
        console.log(`Created active order for driver: ${d.name} (${d.email})`);
      } else {
        existing.status = 'On the Way';
        existing.driverProgress = 0;
        existing.pickup = { lat: 22.3568, lng: 91.7832 };
        existing.destination = { lat: 22.3648, lng: 91.8012 };
        existing.deliveryAddress = { lat: 22.3648, lng: 91.8012 };
        existing.currentLocation = { lat: 22.3568, lng: 91.7832, updatedAt: new Date() };
        await existing.save();
        console.log(`Updated active order for driver: ${d.name} (${d.email})`);
      }
    }

    console.log('All drivers now have fresh active orders ready for simulation!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating orders for drivers:', err);
    process.exit(1);
  }
}

createDemoOrderForEveryDriver();
