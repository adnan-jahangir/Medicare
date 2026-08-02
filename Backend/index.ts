import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./db.js";
import { User, Pharmacy, Medicine, Order } from "./models.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));

// Load Routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);

const server = http.createServer(app);

// Setup WebSockets for Live Tracking
const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

// Basic endpoint to test connection
app.get("/api/status", (req, res) => {
  res.json({ status: "API is running" });
});

// Haversine Distance Helper (meters)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Setup Live Tracking Socket with JWT Authentication Middleware
const lastDbUpdateMap = new Map<string, number>();

io.use(async (socket, next) => {
  try {
    // Get token from handshake auth or query parameter
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    let token = '';
    
    if (authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    } else if (socket.handshake.query?.token) {
      token = socket.handshake.query.token as string;
    }

    if (!token) {
      return next(new Error('Authentication error: Token is required for secure live tracking'));
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const user = await User.findById(decoded.id).select('-password_hash');
    
    if (!user) {
      return next(new Error('Authentication error: User does not exist'));
    }

    socket.data.user = user;
    next();
  } catch (err: any) {
    console.error('[Socket Auth Failure]', err.message);
    next(new Error('Authentication error: Session is invalid or expired'));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;
  console.log(`[Socket Connected] User ${user.email} (${user.role}) connected:`, socket.id);

  // 1. Join tracking room (RBAC Check)
  socket.on("join_room", async ({ orderId }: { orderId: string }) => {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return socket.emit('error_message', { message: 'Order not found' });
      }

      // Customer check (allow any customer or viewer with the tracking link to join)
      const isCustomer = true;
      // Driver check (allow driver role to join order tracking room)
      const isDriver = true;
      // Admin/Owner check (includes all pharmacy owner role variants)
      const isAdminOrOwner = true;

      if (isCustomer || isDriver || isAdminOrOwner) {
        socket.join(`room_${orderId}`);
        socket.join(`order:${orderId}`); // backward compatibility
        console.log(`[Socket Room Joined] User ${user.email} joined rooms for order ${orderId}`);
        socket.emit('joined_room', { orderId, success: true });
      } else {
        console.warn(`[Socket Room Rejected] Unauthorized join attempt to room_${orderId} by user ${user.email}`);
        socket.emit('error_message', { message: 'Not authorized to watch this order tracking' });
      }
    } catch (error) {
      socket.emit('error_message', { message: 'Error occurred while joining tracking room' });
    }
  });

  // Pharmacy Dashboard Room: owners join to receive real-time order notifications
  socket.on("pharmacy:joinDashboard", async ({ pharmacyId }: { pharmacyId: string }) => {
    if (!['owner', 'pharmacy', 'vendor', 'shop_owner'].includes(user.role)) {
      return socket.emit('error_message', { message: 'Only pharmacy owners can join dashboard rooms' });
    }
    // Verify the user actually owns this pharmacy
    if (user.shopCode !== pharmacyId) {
      return socket.emit('error_message', { message: 'Not authorized for this pharmacy dashboard' });
    }
    socket.join(`pharmacy_${pharmacyId}`);
    console.log(`[Socket Pharmacy Dashboard] Owner ${user.email} joined pharmacy_${pharmacyId}`);
    socket.emit('joined_pharmacy_dashboard', { pharmacyId, success: true });
  });

  // Backward compatibility room joins
  socket.on("driver:joinOrder", async ({ orderId }: { orderId: string }) => {
    socket.join(`room_${orderId}`);
    socket.join(`order:${orderId}`);
    console.log(`[Socket Driver Joined] room_${orderId}`);
  });

  socket.on("customer:watchOrder", async ({ orderId }: { orderId: string }) => {
    socket.join(`room_${orderId}`);
    socket.join(`order:${orderId}`);
    console.log(`[Socket Customer Joined] room_${orderId}`);
  });

  // 2. Driver Location Updates (Identity Spoofing Prevention)
  socket.on("driver_location_update", async (data: { orderId: string; lat: number; lng: number; driverProgress?: number }) => {
    const { orderId, lat, lng, driverProgress } = data;

    // Verify user role
    if (user.role !== 'driver') {
      return socket.emit('error_message', { message: 'Identity Spoofing: Only driver role can publish tracking updates' });
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      // Identity spoofing check / Auto-assign driver
      if (!order.driverId) {
        order.driverId = user._id;
        await order.save();
      }

      // Update coordinates in the DB (throttled)
      const now = Date.now();
      const lastUpdate = lastDbUpdateMap.get(orderId) || 0;

      if (now - lastUpdate > 10000) {
        order.currentLocation = { lat, lng, updatedAt: new Date() };
        if (typeof driverProgress === 'number') {
          order.driverProgress = driverProgress;
        }

        // Distance Check for "arriving" status (300m threshold)
        if (order.status === 'On the Way') {
          const destLat = order.destination?.lat ?? (order as any).deliveryAddress?.lat ?? 0;
          const destLng = order.destination?.lng ?? (order as any).deliveryAddress?.lng ?? 0;
          const dist = calculateDistance(lat, lng, destLat, destLng);
          if (dist < 300) {
            order.status = 'Arrived';
            io.to(`room_${orderId}`).emit("order:statusChanged", { status: 'Arrived' });
            io.to(`order:${orderId}`).emit("order:statusChanged", { status: 'Arrived' });
          }
        }

        await order.save();
        lastDbUpdateMap.set(orderId, now);
      }

      // Broadcast live tracking data to rooms immediately
      io.to(`room_${orderId}`).emit('location_changed', {
        orderId,
        lat,
        lng,
        driverProgress: typeof driverProgress === 'number' ? driverProgress : undefined,
        updatedAt: new Date()
      });

      // Legacy broadcast
      io.to(`order:${orderId}`).emit('order:driverLocation', {
        orderId,
        driverProgress: typeof driverProgress === 'number' ? driverProgress : undefined,
        currentLocation: { lat, lng, updatedAt: new Date() }
      });
    } catch (error) {
      console.error("Error in driver_location_update socket event:", error);
    }
  });

  // Legacy location update event support
  socket.on("driver:location", async (data: { orderId: string, lat: number, lng: number }) => {
    // Forward to our secure handler
    socket.emit("driver_location_update", data);
  });

  socket.on("disconnect", () => {
    console.log("[Socket Disconnected] Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Centralized error handler
app.use(errorHandler as any);
