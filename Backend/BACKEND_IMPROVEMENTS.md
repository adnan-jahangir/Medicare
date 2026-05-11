# Backend Improvement Suggestions & Best Practices

## 🚀 Current Architecture Summary

Your pharmacy dashboard backend is a Node.js/Express application with:

- **Database**: MongoDB for data persistence
- **Authentication**: JWT tokens with bcrypt password hashing
- **API**: RESTful API with role-based access control
- **Real-time**: Socket.io for live tracking
- **Structure**: Modular routes with middleware

---

## 🔴 Critical Improvements Needed

### 1. **Input Validation (HIGH PRIORITY)**

**Issue**: Insufficient input validation on all routes

**Current Problem**:

```typescript
router.post("/", async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  // No validation before using these
});
```

**Solution**: Use a validation library like `joi` or `zod`

```bash
npm install joi
```

**Implementation**:

```typescript
import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("customer", "owner", "admin", "driver"),
});

router.post("/register", async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  // Use validated 'value'
});
```

---

### 2. **Error Handling Middleware (HIGH PRIORITY)**

**Issue**: No centralized error handling

**Solution**: Create error handling middleware

```typescript
// server/middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Add to server/index.ts:
app.use(errorHandler);
```

---

### 3. **Rate Limiting (HIGH PRIORITY)**

**Issue**: No protection against brute force attacks

**Solution**:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again later",
});

router.post("/login", loginLimiter, async (req, res) => {
  // Login logic
});
```

---

### 4. **Request Logging (MEDIUM PRIORITY)**

**Issue**: No logging for debugging and monitoring

**Solution**:

```bash
npm install morgan winston
```

```typescript
import morgan from "morgan";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message),
    },
  }),
);
```

---

### 5. **Data Validation at Database Level (MEDIUM PRIORITY)**

**Issue**: MongoDB schema validation is minimal

**Solution**: Add more robust validation to schemas

```typescript
const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Medicine name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
    validate: {
      validator: (v) => v % 0.01 === 0,
      message: "Price must have max 2 decimal places",
    },
  },
  stock: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"],
    default: 0,
  },
});
```

---

## 🟡 Security Improvements

### 1. **CORS Configuration**

**Current**: `app.use(cors());` - allows all origins

**Better**:

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:8080"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
```

---

### 2. **Helmet for Security Headers**

```bash
npm install helmet
```

```typescript
import helmet from "helmet";
app.use(helmet());
```

---

### 3. **Environment Variables Validation**

```typescript
// server/config/env.ts
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "PORT"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

### 4. **SQL/NoSQL Injection Prevention**

Currently using mongoose which has built-in protection, but be careful with:

```typescript
// ❌ BAD - vulnerable
const query = `{ email: "${userInput}" }`;

// ✓ GOOD - safe
const query = { email: userInput }; // mongoose sanitizes this
```

---

### 5. **JWT Token Expiration & Refresh Tokens**

**Current Issue**: 30-day expiration is too long

**Better Solution**:

```typescript
// Short-lived access token + refresh token
const generateTokens = (id: string, role: string) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m", // Short expiration
  });

  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Add refresh endpoint:
router.post("/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  // Verify refresh token and issue new access token
});
```

---

## 🟢 Performance Improvements

### 1. **Database Indexing**

```typescript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

const medicineSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    index: true,
  },
  category: { type: String, index: true },
  price: { type: Number, index: true },
});
```

---

### 2. **Pagination for Large Datasets**

```typescript
router.get("/medicines", async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const medicines = await Medicine.find()
    .skip(skip)
    .limit(parseInt(limit as string))
    .sort({ createdAt: -1 });

  const total = await Medicine.countDocuments();

  res.json({
    success: true,
    data: medicines,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});
```

---

### 3. **Caching Strategy**

```bash
npm install redis
```

```typescript
import redis from "redis";

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Cache medicines
router.get("/medicines", async (req: Request, res: Response) => {
  const cacheKey = `medicines:${JSON.stringify(req.query)}`;

  // Check cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from DB
  const medicines = await Medicine.find(req.query);

  // Cache for 1 hour
  await redisClient.setex(cacheKey, 3600, JSON.stringify(medicines));

  res.json(medicines);
});
```

---

### 4. **Query Optimization**

```typescript
// ❌ Multiple queries (N+1 problem)
const orders = await Order.find();
orders.forEach(async (order) => {
  const pharmacy = await Pharmacy.findById(order.pharmacyId);
});

// ✓ Optimized with populate
const orders = await Order.find()
  .populate("pharmacyId", "name city") // Only needed fields
  .populate("items.medicine", "name price");
```

---

### 5. **Lean Queries for Read-Only Data**

```typescript
// Use .lean() for faster queries when not modifying data
const medicines = await Medicine.find()
  .lean() // Returns plain JavaScript objects, not mongoose docs
  .limit(100);
```

---

## 🔵 Architecture & Code Quality

### 1. **Service Layer Pattern**

Create services to separate business logic from routes:

```typescript
// server/services/orderService.ts
export class OrderService {
  async createOrder(userId: string, orderData: IOrderData) {
    // Validate stock
    for (const item of orderData.items) {
      const medicine = await Medicine.findById(item.medicine);
      if (medicine.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}`);
      }
    }

    // Create order
    const order = await Order.create(orderData);

    // Reduce stock
    for (const item of orderData.items) {
      await Medicine.findByIdAndUpdate(item.medicine, {
        $inc: { stock: -item.quantity },
      });
    }

    return order;
  }
}

// In routes
import { OrderService } from "../services/orderService.js";

router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const order = await OrderService.createOrder(req.user._id, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

---

### 2. **TypeScript Strict Mode**

Update `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

---

### 3. **Constants & Configuration**

```typescript
// server/config/constants.ts
export const ORDER_STATUSES = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  DELIVERED: "Delivered",
} as const;

export const MEDICINE_CATEGORIES = [
  "Pain Relief",
  "Antibiotics",
  "Vitamins",
  "Cold & Flu",
  "Digestive",
  "Diabetes",
  "Heart",
  "Skin Care",
] as const;

export const USER_ROLES = {
  CUSTOMER: "customer",
  OWNER: "owner",
  ADMIN: "admin",
  DRIVER: "driver",
} as const;
```

---

### 4. **API Versioning**

```typescript
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/medicines", medicineRoutes);
app.use("/api/v1/orders", orderRoutes);
// Future: /api/v2/... for breaking changes
```

---

## 📊 Testing

### Add Unit & Integration Tests

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

```typescript
// server/routes/__tests__/auth.test.ts
import request from "supertest";
import app from "../../index";

describe("Auth Routes", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("token");
  });
});
```

---

## 🗄️ Database Improvements

### 1. **Add Soft Delete**

```typescript
const medicineSchema = new mongoose.Schema({
  // ... existing fields
  deletedAt: { type: Date, default: null },
});

// Auto-exclude soft-deleted items
medicineSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
```

---

### 2. **Audit Logging**

```typescript
const auditSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String, // 'CREATE', 'UPDATE', 'DELETE'
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  changes: Object,
  timestamp: { type: Date, default: Date.now },
});

// Use in middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (req.method !== "GET") {
      // Log audit trail
      AuditLog.create({
        userId: req.user?._id,
        action: req.method,
        // ... other fields
      });
    }
    return originalJson.call(this, data);
  };
  next();
});
```

---

## 🚀 Deployment Recommendations

### 1. **Environment-Specific Configs**

```typescript
// server/config/index.ts
export const config = {
  development: {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    port: 5001,
    logLevel: "debug",
  },
  production: {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    port: process.env.PORT,
    logLevel: "error",
  },
}[process.env.NODE_ENV || "development"];
```

---

### 2. **Health Check Endpoint**

```typescript
app.get("/api/health", async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "healthy" : "unhealthy",
    timestamp: new Date(),
    database: dbConnected ? "connected" : "disconnected",
  });
});
```

---

### 3. **Graceful Shutdown**

```typescript
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    await mongoose.disconnect();
    console.log("HTTP server closed, database connection closed");
    process.exit(0);
  });
});
```

---

## 📋 Next Steps Checklist

- [ ] Implement input validation with Joi
- [ ] Add error handling middleware
- [ ] Set up rate limiting
- [ ] Configure logging (Winston/Morgan)
- [ ] Add database indexing
- [ ] Implement pagination
- [ ] Add caching layer (Redis)
- [ ] Create service layer
- [ ] Add API versioning
- [ ] Write unit tests
- [ ] Set up CI/CD pipeline
- [ ] Add health check endpoint
- [ ] Implement refresh token system
- [ ] Add data encryption for sensitive fields
- [ ] Set up monitoring/alerting (e.g., Sentry)

---

## 📚 Recommended Packages to Add

```json
{
  "dependencies": {
    "joi": "^17.x",
    "helmet": "^7.x",
    "express-rate-limit": "^7.x",
    "morgan": "^1.x",
    "winston": "^3.x",
    "redis": "^4.x",
    "validator": "^13.x"
  },
  "devDependencies": {
    "jest": "^29.x",
    "@types/jest": "^29.x",
    "ts-jest": "^29.x",
    "supertest": "^6.x",
    "@types/supertest": "^2.x"
  }
}
```

---

This backend provides a solid foundation for a pharmacy management system. By implementing these suggestions, you'll have a production-ready, scalable, and secure API.
