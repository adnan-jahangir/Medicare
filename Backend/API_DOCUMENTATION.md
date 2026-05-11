# Pharmacy Dashboard Pro - API Documentation

## Base URL

```
http://localhost:5001/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 📋 Authentication Routes

### 1. Register User

- **Route**: `POST /auth/register`
- **Access**: Public
- **Description**: Create a new user account
- **Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer|owner|admin",
  "shopCode": "SHOP001", // Optional - for owners
  "shopName": "My Pharmacy", // Optional
  "shopLocation": "New York" // Optional
}
```

- **Response** (201):

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "token": "jwt_token"
  }
}
```

### 2. Login

- **Route**: `POST /auth/login`
- **Access**: Public
- **Description**: Authenticate and get JWT token
- **Request Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

- **Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "shopCode": "SHOP001",
    "shopName": "My Pharmacy",
    "token": "jwt_token"
  }
}
```

### 3. Verify Token

- **Route**: `GET /auth/verify`
- **Access**: Private (requires token)
- **Description**: Verify current token and get user info
- **Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

## 💊 Medicine Routes

### 1. Get All Medicines

- **Route**: `GET /medicines`
- **Access**: Public
- **Query Parameters**:
  - `pharmacyId` - Filter by pharmacy
  - `category` - Filter by category
  - `search` - Search by name, brand, or description
  - `minPrice` - Minimum price filter
  - `maxPrice` - Maximum price filter
  - `prescriptionOnly` - Show only prescription medicines
  - `sort` - Sort options: `price-asc`, `price-desc`, `newest`
- **Example**: `/medicines?category=Antibiotics&minPrice=10&maxPrice=50&sort=price-asc`
- **Response** (200):

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "medicine_id",
      "pharmacyId": {
        "_id": "pharmacy_id",
        "name": "GreenLeaf",
        "city": "NYC"
      },
      "name": "Aspirin",
      "brand": "Bayer",
      "strength": "500mg",
      "dosage": "1 tablet twice daily",
      "description": "Pain reliever",
      "category": "Pain Relief",
      "price": 5.99,
      "stock": 100,
      "image": "url_to_image",
      "prescriptionRequired": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Single Medicine

- **Route**: `GET /medicines/:id`
- **Access**: Public
- **Response** (200): Same as single medicine object above

### 3. Create Medicine

- **Route**: `POST /medicines`
- **Access**: Private (owner, admin)
- **Request Body**:

```json
{
  "pharmacyId": "pharmacy_id",
  "name": "Aspirin",
  "brand": "Bayer",
  "strength": "500mg",
  "dosage": "1 tablet twice daily",
  "description": "Pain reliever",
  "category": "Pain Relief",
  "price": 5.99,
  "stock": 100,
  "image": "url_to_image",
  "prescriptionRequired": false
}
```

- **Response** (201): Medicine object with success message

### 4. Update Medicine

- **Route**: `PATCH /medicines/:id`
- **Access**: Private (owner, admin)
- **Request Body**: Any fields to update (same as create)
- **Response** (200): Updated medicine object

### 5. Delete Medicine

- **Route**: `DELETE /medicines/:id`
- **Access**: Private (owner, admin)
- **Response** (200):

```json
{
  "success": true,
  "message": "Medicine removed successfully"
}
```

### 6. Get Medicines by Category

- **Route**: `GET /medicines/category/:category`
- **Access**: Public
- **Response** (200): Array of medicines in that category

---

## 📦 Order Routes

### 1. Create Order

- **Route**: `POST /orders`
- **Access**: Private (customer)
- **Request Body**:

```json
{
  "pharmacyId": "pharmacy_id",
  "items": [
    {
      "medicine": "medicine_id",
      "quantity": 2
    }
  ],
  "total": 29.98,
  "destination": {
    "lat": 40.7128,
    "lng": -74.006
  }
}
```

- **Response** (201):

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id",
    "pharmacyId": "pharmacy_id",
    "customerEmail": "user@example.com",
    "items": [
      {
        "medicine": {
          /* medicine details */
        },
        "quantity": 2
      }
    ],
    "total": 29.98,
    "status": "Pending",
    "destination": { "lat": 40.7128, "lng": -74.006 },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Get User's Orders

- **Route**: `GET /orders`
- **Access**: Private
- **Description**:
  - Customers: See only their orders
  - Owners: See orders for their pharmacies
  - Admins: See all orders
- **Response** (200): Array of orders

### 3. Get Single Order

- **Route**: `GET /orders/:id`
- **Access**: Private
- **Response** (200): Order object with populated medicine details

### 4. Update Order Status

- **Route**: `PATCH /orders/:id`
- **Access**: Private (admin, owner)
- **Request Body**:

```json
{
  "status": "Confirmed|Preparing|Ready|Delivered",
  "driverId": "driver_id",
  "currentLocation": {
    "lat": 40.7128,
    "lng": -74.006
  }
}
```

- **Response** (200): Updated order object

### 5. Update Driver Progress (Live Tracking)

- **Route**: `PATCH /orders/:id/driver-progress`
- **Access**: Private (driver)
- **Request Body**:

```json
{
  "driverProgress": 0.5,
  "currentLocation": {
    "lat": 40.7128,
    "lng": -74.006
  }
}
```

- **Response** (200): Updated order with progress

### 6. Delete Order

- **Route**: `DELETE /orders/:id`
- **Access**: Private (admin)
- **Response** (200): Success message

### 7. Get Order Statistics

- **Route**: `GET /orders/stats/overview`
- **Access**: Private
- **Response** (200):

```json
{
  "success": true,
  "data": {
    "totalOrders": 10,
    "deliveredOrders": 8,
    "pendingOrders": 2,
    "totalRevenue": 500.5
  }
}
```

---

## 🏥 Pharmacy Routes

### 1. Get All Pharmacies

- **Route**: `GET /pharmacies`
- **Access**: Public
- **Query Parameters**:
  - `city` - Filter by city
  - `rating` - Filter by minimum rating
  - `sort` - Sort by: `revenue` or default (rating)
- **Response** (200): Array of pharmacies

### 2. Get Single Pharmacy

- **Route**: `GET /pharmacies/:id`
- **Access**: Public
- **Response** (200): Pharmacy object

### 3. Create Pharmacy

- **Route**: `POST /pharmacies`
- **Access**: Private (admin, owner)
- **Request Body**:

```json
{
  "name": "GreenLeaf Pharmacy",
  "city": "New York",
  "ownerName": "Dr. Smith"
}
```

- **Response** (201): Pharmacy object

### 4. Update Pharmacy

- **Route**: `PATCH /pharmacies/:id`
- **Access**: Private (admin, owner)
- **Request Body**: Fields to update (name, city, rating, ownerName, monthlyRevenue)
- **Response** (200): Updated pharmacy object

### 5. Delete Pharmacy

- **Route**: `DELETE /pharmacies/:id`
- **Access**: Private (admin)
- **Response** (200): Success message

---

## 👤 User Routes

### 1. Get User Profile

- **Route**: `GET /users/profile`
- **Access**: Private
- **Response** (200): Current user object

### 2. Update User Profile

- **Route**: `PATCH /users/profile`
- **Access**: Private
- **Request Body**:

```json
{
  "name": "New Name",
  "shopCode": "NEW_CODE",
  "shopName": "New Shop",
  "shopLocation": "New City"
}
```

- **Response** (200): Updated user object

### 3. Change Password

- **Route**: `PATCH /users/change-password`
- **Access**: Private
- **Request Body**:

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

- **Response** (200): Success message

### 4. Get All Users (Admin)

- **Route**: `GET /users`
- **Access**: Private (admin)
- **Query Parameters**:
  - `role` - Filter by role
- **Response** (200): Array of users

### 5. Get User by ID (Admin)

- **Route**: `GET /users/:id`
- **Access**: Private (admin)
- **Response** (200): User object

### 6. Update User (Admin)

- **Route**: `PATCH /users/:id`
- **Access**: Private (admin)
- **Request Body**: Fields to update (name, role, shopCode, shopName, shopLocation)
- **Response** (200): Updated user object

### 7. Delete User (Admin)

- **Route**: `DELETE /users/:id`
- **Access**: Private (admin)
- **Response** (200): Success message

---

## 📊 Dashboard Routes

### 1. Admin Dashboard Stats

- **Route**: `GET /dashboard/admin`
- **Access**: Private (admin)
- **Response** (200):

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 100,
      "totalPharmacies": 10,
      "totalMedicines": 500,
      "totalOrders": 1000,
      "deliveredOrders": 950,
      "totalRevenue": 50000
    },
    "recentOrders": [
      /* array of 6 recent orders */
    ],
    "usersByRole": [
      /* breakdown by role */
    ],
    "topMedicines": [
      /* top 5 medicines */
    ]
  }
}
```

### 2. Owner Dashboard Stats

- **Route**: `GET /dashboard/owner`
- **Access**: Private (owner)
- **Response** (200): Stats, recent orders, low stock medicines, and sales metrics

### 3. Customer Dashboard Stats

- **Route**: `GET /dashboard/customer`
- **Access**: Private (customer)
- **Response** (200): Customer order stats and recent orders

### 4. Analytics Data

- **Route**: `GET /dashboard/analytics`
- **Access**: Private (admin, owner)
- **Query Parameters**:
  - `days` - Number of days to analyze (default: 30)
- **Response** (200): Daily orders, status breakdown, and top categories

---

## Error Responses

### Common Error Responses

**400 Bad Request**:

```json
{
  "message": "Description of what went wrong"
}
```

**401 Unauthorized**:

```json
{
  "message": "Not authorized, token failed" or "Not authorized, no token"
}
```

**403 Forbidden**:

```json
{
  "message": "User role 'customer' is not authorized to access this route."
}
```

**404 Not Found**:

```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error**:

```json
{
  "message": "Server error description"
}
```

---

## User Roles and Permissions

| Endpoint             | Customer | Owner | Admin | Driver | Public |
| -------------------- | -------- | ----- | ----- | ------ | ------ |
| POST /auth/register  | ✓        | ✓     | ✓     | ✓      | ✓      |
| POST /auth/login     | ✓        | ✓     | ✓     | ✓      | ✓      |
| GET /medicines       | ✓        | ✓     | ✓     | ✓      | ✓      |
| POST /medicines      | -        | ✓     | ✓     | -      | -      |
| POST /orders         | ✓        | -     | -     | -      | -      |
| GET /orders          | ✓\*      | ✓\*   | ✓     | -      | -      |
| PATCH /orders/:id    | -        | ✓     | ✓     | -      | -      |
| GET /pharmacies      | ✓        | ✓     | ✓     | ✓      | ✓      |
| POST /pharmacies     | -        | ✓     | ✓     | -      | -      |
| GET /dashboard/admin | -        | -     | ✓     | -      | -      |
| GET /dashboard/owner | -        | ✓     | -     | -      | -      |
| GET /users           | -        | -     | ✓     | -      | -      |

\*Customers see only their orders, Owners see their pharmacy's orders

---

## Testing with cURL

### Register:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

### Login:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Medicines:

```bash
curl -X GET http://localhost:5001/api/medicines?category=Antibiotics \
  -H "Content-Type: application/json"
```

### Create Order (with token):

```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pharmacyId": "pharmacy_id",
    "items": [
      {
        "medicine": "medicine_id",
        "quantity": 2
      }
    ],
    "total": 29.98,
    "destination": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }'
```

---

## WebSocket Events (Socket.io)

### Client to Server:

- `driver_update_location` - Driver sends location update
  ```javascript
  socket.emit("driver_update_location", {
    orderId: "order_id",
    lat: 40.7128,
    lng: -74.006,
  });
  ```

### Server to Client:

- `location_changed` - Notifies of location update
  ```javascript
  socket.on("location_changed", (data) => {
    console.log(data.lat, data.lng);
  });
  ```
