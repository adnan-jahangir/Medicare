import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

/**
 * Dynamic state-driven privacy masking function (RBAC)
 * Masks customer details and pharmacy locations based on order status and requester role.
 */
export const maskOrderPrivacy = (orderObj: any, userRole: string): any => {
  if (!orderObj) return orderObj;

  // Convert Mongoose document to plain object if necessary
  const order = typeof orderObj.toObject === 'function' ? orderObj.toObject() : { ...orderObj };

  // If requester is a driver, apply strict privacy rules
  if (userRole === 'driver') {
    const status = order.status;

    // 1. Customer Privacy Rules
    const isAssignedDriver = ['Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(status);
    const isCompletedOrCancelled = status === 'Completed' || status === 'Cancelled' || status === 'Delivered';

    // If order is unassigned or completed/cancelled, mask coordinates
    if (!isAssignedDriver && !isCompletedOrCancelled) {
      order.customerPhone = '[MASKED]';
      order.customerAddress = '[MASKED]';
      order.address = '[MASKED]';
      order.zip = '[MASKED]';
    }

    if (isCompletedOrCancelled) {
      // Once completed or cancelled, redact personal details
      order.customerName = '[MASKED]';
      order.customerEmail = '[MASKED]';
      order.customerPhone = '[MASKED]';
      order.customerAddress = '[MASKED]';
      order.address = '[MASKED]';
      order.zip = '[MASKED]';
    }

    // 2. Preserve valid coordinates for active tracking maps
    // Ensure pickup and destination coordinates remain valid numbers so map rendering never drops to 0,0
    if (!order.pickup || typeof order.pickup.lat !== 'number' || order.pickup.lat === 0) {
      order.pickup = { lat: 22.3568, lng: 91.7832 }; // Fallback Chittagong
    }
  }

  // If requester is a customer, ensure they can always see pharmacy location, but mask driver phone if needed
  if (userRole === 'customer') {
    // Customers see everything related to the order (no pharmacy masking)
    // But protect driver personal email or NID details if populated
    if (order.driverId && typeof order.driverId === 'object') {
      delete order.driverId.nidNumber;
      delete order.driverId.nidFront;
      delete order.driverId.nidBack;
      delete order.driverId.drivingLicense;
      delete order.driverId.password_hash;
    }
  }

  return order;
};

/**
 * Express middleware to automatically serialize and mask order data in the response body.
 * Intercepts res.json to apply dynamic state-driven masking.
 */
export const applyOrderPrivacy = (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: any): Response {
    if (!req.user) {
      return originalJson.call(this, body);
    }

    const userRole = req.user.role;

    try {
      if (body && body.success) {
        if (Array.isArray(body.data)) {
          body.data = body.data.map((order: any) => maskOrderPrivacy(order, userRole));
        } else if (body.data) {
          body.data = maskOrderPrivacy(body.data, userRole);
        }
      }
    } catch (err) {
      console.error('Error in privacy masking middleware:', err);
    }

    return originalJson.call(this, body);
  };

  next();
};
