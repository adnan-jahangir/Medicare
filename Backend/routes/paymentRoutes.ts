import express, { Response } from 'express';
import axios from 'axios';
import { Order, Medicine } from '../models.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aamarpay Credentials from Environment Variables (with sandboxed defaults)
const STORE_ID = process.env.AMARPAY_STORE_ID || 'aamarpaytest';
const SIGNATURE_KEY = process.env.AMARPAY_SIGNATURE_KEY || 'dbb74894e82415a2f7ff0ec3a97e4183';
const AMARPAY_API_URL = process.env.AMARPAY_API_URL || 'https://sandbox.aamarpay.com/jsonpost.php';

// @route   POST /api/payment/initiate
// @desc    Initiate payment via Aamarpay (Creates pending order draft, cleaned up on cancel/fail)
// @access  Private (JWT Auth)
router.post('/initiate', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, orderPayload, amount, name, email, phone, address, city, zip, backendUrl, frontendUrl } = req.body;

    let targetOrder = null;

    if (orderId) {
      targetOrder = await Order.findById(orderId);
    } else if (orderPayload) {
      // Create pending order draft from payload
      targetOrder = new Order({
        ...orderPayload,
        customerEmail: req.user.email,
        customerName: name || req.user.name,
        customerPhone: phone || req.user.phoneNumber,
        customerAddress: `${address || ''}, ${city || ''} (ZIP: ${zip || ''})`,
        paymentMethod: 'Online Payment',
        paymentStatus: 'Pending',
        status: 'Pending'
      });
      await targetOrder.save();
    }

    if (!targetOrder) {
      return res.status(400).json({ success: false, message: 'Valid Order ID or Order Payload is required' });
    }

    const currentOrderId = targetOrder._id.toString();
    const payAmount = amount || targetOrder.total;

    // Generate unique transaction ID
    const tranId = `TXN-${currentOrderId.slice(-6)}-${Date.now()}`;

    // Update order with transaction details
    targetOrder.tranId = tranId;
    targetOrder.paymentMethod = 'Online Payment';
    targetOrder.paymentStatus = 'Pending';
    if (name) targetOrder.customerName = name;
    if (phone) targetOrder.customerPhone = phone;
    if (address) targetOrder.customerAddress = `${address}, ${city || ''} (ZIP: ${zip || ''})`;

    await targetOrder.save();

    // Dynamically resolve Backend and Frontend URLs (supports localhost and live Render/Vercel)
    const hostBackend = backendUrl || process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const hostFrontend = frontendUrl || process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5173';

    // Prepare Aamarpay Payload
    const paymentPayload = {
      store_id: STORE_ID,
      signature_key: SIGNATURE_KEY,
      tran_id: tranId,
      amount: Number(payAmount).toFixed(2),
      currency: 'BDT',
      desc: `MediCare Order #${currentOrderId.slice(-6).toUpperCase()}`,
      cus_name: name || req.user.name || 'Customer',
      cus_email: email || req.user.email || 'customer@medicare.com',
      cus_phone: phone || req.user.phoneNumber || '01700000000',
      cus_add1: address || 'Dhaka',
      cus_add2: city || 'Dhaka',
      cus_city: city || 'Dhaka',
      cus_state: city || 'Dhaka',
      cus_postcode: zip || '1200',
      cus_country: 'Bangladesh',
      success_url: `${hostBackend}/api/payment/success?orderId=${currentOrderId}&tranId=${tranId}&fUrl=${encodeURIComponent(hostFrontend)}`,
      fail_url: `${hostBackend}/api/payment/fail?orderId=${currentOrderId}&tranId=${tranId}&fUrl=${encodeURIComponent(hostFrontend)}`,
      cancel_url: `${hostBackend}/api/payment/cancel?orderId=${currentOrderId}&tranId=${tranId}&fUrl=${encodeURIComponent(hostFrontend)}`,
      type: 'json'
    };

    console.log('[Aamarpay Sandbox] Initiating transaction:', { tranId, currentOrderId, hostBackend, hostFrontend });

    // POST request to Aamarpay Sandbox API
    let paymentUrl: string | null = null;
    try {
      const response = await axios.post(AMARPAY_API_URL, paymentPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      let resData = response.data;
      if (typeof resData === 'string') {
        try { resData = JSON.parse(resData); } catch (e) {}
      }

      paymentUrl = resData?.payment_url || resData?.paymentUrl || resData?.url || (typeof resData === 'string' && resData.includes('http') ? resData : null);
    } catch (err: any) {
      console.error('[Aamarpay Sandbox API Call Error]', err.message);
    }

    if (!paymentUrl) {
      paymentUrl = `https://sandbox.aamarpay.com/paynow.php?track=${tranId}`;
    }

    let trackId: string | null = null;
    if (paymentUrl) {
      const match = paymentUrl.match(/track=([A-Za-z0-9]+)/);
      if (match) trackId = match[1];
    }

    // Form payload for HTML Form POST submission
    const formData = {
      store_id: STORE_ID,
      signature_key: SIGNATURE_KEY,
      tran_id: tranId,
      amount: Number(payAmount).toFixed(2),
      currency: 'BDT',
      desc: `MediCare Order #${currentOrderId.slice(-6).toUpperCase()}`,
      cus_name: name || req.user.name || 'Customer',
      cus_email: email || req.user.email || 'customer@medicare.com',
      cus_phone: phone || req.user.phoneNumber || '01700000000',
      cus_add1: address || 'Dhaka',
      cus_add2: city || 'Dhaka',
      cus_city: city || 'Dhaka',
      cus_state: city || 'Dhaka',
      cus_postcode: zip || '1200',
      cus_country: 'Bangladesh',
      success_url: `${hostBackend}/api/payment/success?orderId=${currentOrderId}&tranId=${tranId}&fUrl=${encodeURIComponent(hostFrontend)}`,
      fail_url: `${hostBackend}/api/payment/fail?orderId=${currentOrderId}&tranId=${tranId}&fUrl=${encodeURIComponent(hostFrontend)}`,
      cancel_url: `${hostBackend}/api/payment/cancel?orderId=${currentOrderId}&tranId=${tranId}&fUrl=${encodeURIComponent(hostFrontend)}`
    };

    return res.json({
      success: true,
      orderId: currentOrderId,
      url: paymentUrl,
      tranId,
      trackId,
      formAction: 'https://sandbox.aamarpay.com/index.php',
      formData
    });
  } catch (error: any) {
    console.error('[Aamarpay exception]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   ALL /api/payment/success
// @desc    Webhook/Callback hit by Aamarpay on successful payment
// @access  Public (Aamarpay callback)
router.all('/success', async (req: any, res: Response) => {
  try {
    const params = { ...req.query, ...req.body };
    const orderId = params.orderId || req.query.orderId;
    const tranId = params.tranId || req.query.tranId;
    const clientFrontend = params.fUrl ? decodeURIComponent(params.fUrl) : (process.env.FRONTEND_URL || 'http://localhost:5173');

    console.log('[Aamarpay success callback]', { orderId, tranId, clientFrontend });

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        await order.save();

        // Reduce stock for items
        for (const item of order.items) {
          try {
            await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stock: -item.quantity } });
          } catch (e) {}
        }

        console.log(`[Order Paid Success] Order #${orderId} confirmed upon payment!`);
      }
    }

    return res.redirect(`${clientFrontend}/payment/success?orderId=${orderId || ''}&tranId=${tranId || ''}`);
  } catch (error: any) {
    console.error('[Aamarpay success webhook exception]', error);
    const clientFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientFrontend}/payment/success`);
  }
});

// @route   ALL /api/payment/fail
// @desc    Webhook/Callback hit by Aamarpay on payment failure
// @access  Public (Aamarpay callback)
router.all('/fail', async (req: any, res: Response) => {
  try {
    const params = { ...req.query, ...req.body };
    const orderId = params.orderId || req.query.orderId;
    const clientFrontend = params.fUrl ? decodeURIComponent(params.fUrl) : (process.env.FRONTEND_URL || 'http://localhost:5173');

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus === 'Pending') {
        // Remove unfulfilled pending order so it doesn't accumulate
        await Order.findByIdAndDelete(orderId);
        console.log(`[Payment Fail] Pending order #${orderId} deleted.`);
      }
    }

    return res.redirect(`${clientFrontend}/payment/fail?reason=payment_failed`);
  } catch (error: any) {
    console.error('[Aamarpay fail webhook exception]', error);
    const clientFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientFrontend}/payment/fail?reason=exception`);
  }
});

// @route   ALL /api/payment/cancel
// @desc    Webhook/Callback hit by Aamarpay on payment cancel
// @access  Public (Aamarpay callback)
router.all('/cancel', async (req: any, res: Response) => {
  try {
    const params = { ...req.query, ...req.body };
    const orderId = params.orderId || req.query.orderId;
    const clientFrontend = params.fUrl ? decodeURIComponent(params.fUrl) : (process.env.FRONTEND_URL || 'http://localhost:5173');

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus === 'Pending') {
        // Remove cancelled pending order so it doesn't accumulate
        await Order.findByIdAndDelete(orderId);
        console.log(`[Payment Cancelled] Pending order #${orderId} deleted.`);
      }
    }

    return res.redirect(`${clientFrontend}/payment/fail?reason=cancelled`);
  } catch (error: any) {
    console.error('[Aamarpay cancel webhook exception]', error);
    const clientFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientFrontend}/payment/fail?reason=cancelled`);
  }
});

export default router;
