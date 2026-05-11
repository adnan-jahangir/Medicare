import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

const server = http.createServer(app);

// Setup WebSockets for Live Tracking
const io = new Server(server, {
  cors: { origin: "*" },
});

// Basic endpoint to test connection
app.get("/api/status", (req, res) => {
  res.json({ status: "API is running" });
});

// Setup Live Tracking Socket
io.on("connection", (socket) => {
  console.log("User connected via Socket.io:", socket.id);

  socket.on("driver_update_location", async (data) => {
    try {
      if (data.orderId) {
        await Order.findByIdAndUpdate(data.orderId, {
          currentLocation: {
            lat: data.lat,
            lng: data.lng,
            updatedAt: new Date(),
          },
        });
        socket
          .to(data.orderId)
          .emit("location_changed", { lat: data.lat, lng: data.lng });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("join_order_room", (orderId) => {
    socket.join(orderId);
    console.log(`Socket ${socket.id} joined room ${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Centralized error handler
app.use(errorHandler as any);
