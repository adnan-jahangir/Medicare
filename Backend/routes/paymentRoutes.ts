import express, { Response } from 'express';
import axios from 'axios';
import { Order } from '../models.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aamarpay Credentials from Environment Variables (with sandboxed defaults)
const STORE_ID = process.env.AMARPAY_STORE_ID || 'aamarpaytest';
const SIGNATURE_KEY = process.env.AMARPAY_SIGNATURE_KEY || 'dbb74894e82415a2f7ff0ec3a97e4183';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const AMARPAY_API_URL = process.env.AMARPAY_API_URL || 'https://sandbox.aamarpay.com/jsonpost.php';

// @route   POST /api/payment/initiate
// @desc    Initiate payment via Aamarpay
// @access  Private (JWT Auth)
router.post('/initiate', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, amount, name, email, phone, address, city, zip } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ success: false, message: 'Order ID and amount are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Generate unique transaction ID
    const tranId = `TXN-${orderId}-${Date.now()}`;

    // Update order with transaction details and payment method
    order.tranId = tranId;
    order.paymentMethod = 'Online Payment';
    order.paymentStatus = 'Pending';
    
    // Also save customer details to order for tracking/privacy verification
    if (name) order.customerName = name;
    if (phone) order.customerPhone = phone;
    if (address) order.customerAddress = `${address}, ${city || ''} (ZIP: ${zip || ''})`;

    await order.save();

    // Prepare Aamarpay Payload
    const paymentPayload = {
      store_id: STORE_ID,
      signature_key: SIGNATURE_KEY,
      tran_id: tranId,
      amount: Number(amount).toFixed(2),
      currency: 'BDT',
      desc: `MediCare E-Pharmacy Order #${orderId.slice(-6).toUpperCase()}`,
      cus_name: name || req.user.name || 'Customer',
      cus_email: email || req.user.email || 'customer@medicare.com',
      cus_phone: phone || req.user.phoneNumber || '01700000000',
      cus_add1: address || 'Dhaka',
      cus_add2: city || 'Dhaka',
      cus_city: city || 'Dhaka',
      cus_state: city || 'Dhaka',
      cus_postcode: zip || '1200',
      cus_country: 'Bangladesh',
      success_url: `${BACKEND_URL}/api/payment/success?orderId=${orderId}&tranId=${tranId}`,
      fail_url: `${BACKEND_URL}/api/payment/fail?orderId=${orderId}&tranId=${tranId}`,
      cancel_url: `${BACKEND_URL}/api/payment/cancel?orderId=${orderId}&tranId=${tranId}`,
      type: 'json'
    };

    console.log('[Aamarpay Sandbox] Initiating transaction with payload:', { ...paymentPayload, signature_key: '***HIDDEN***' });

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

    // Fallback to direct Aamarpay Sandbox Gateway URL if API URL was not returned
    if (!paymentUrl) {
      console.log('[Aamarpay Fallback] Direct Sandbox URL generated for transaction:', tranId);
      paymentUrl = `https://sandbox.aamarpay.com/paynow.php?track=${tranId}`;
    }

    // Extract track ID for direct method navigation options
    let trackId: string | null = null;
    if (paymentUrl) {
      const match = paymentUrl.match(/track=([A-Za-z0-9]+)/);
      if (match) trackId = match[1];
    }

    // Form payload for HTML Form POST submission (guarantees full payment options render)
    const formData = {
      store_id: STORE_ID,
      signature_key: SIGNATURE_KEY,
      tran_id: tranId,
      amount: Number(amount).toFixed(2),
      currency: 'BDT',
      desc: `MediCare E-Pharmacy Order #${orderId.slice(-6).toUpperCase()}`,
      cus_name: name || req.user.name || 'Customer',
      cus_email: email || req.user.email || 'customer@medicare.com',
      cus_phone: phone || req.user.phoneNumber || '01700000000',
      cus_add1: address || 'Dhaka',
      cus_add2: city || 'Dhaka',
      cus_city: city || 'Dhaka',
      cus_state: city || 'Dhaka',
      cus_postcode: zip || '1200',
      cus_country: 'Bangladesh',
      success_url: `${BACKEND_URL}/api/payment/success?orderId=${orderId}&tranId=${tranId}`,
      fail_url: `${BACKEND_URL}/api/payment/fail?orderId=${orderId}&tranId=${tranId}`,
      cancel_url: `${BACKEND_URL}/api/payment/cancel?orderId=${orderId}&tranId=${tranId}`
    };

    return res.json({
      success: true,
      url: paymentUrl,
      tranId,
      trackId,
      formAction: 'https://sandbox.aamarpay.com/index.php',
      formData,
      methods: trackId ? {
        bkash: `https://sandbox.aamarpay.com/process.php?track=${trackId}&type=14`,
        nagad: `https://sandbox.aamarpay.com/process.php?track=${trackId}&type=31`,
        cards: `https://sandbox.aamarpay.com/process.php?track=${trackId}&type=5`,
        rocket: `https://sandbox.aamarpay.com/process.php?track=${trackId}&type=6`,
      } : null
    });
  } catch (error: any) {
    console.error('[Aamarpay exception]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   ALL /api/payment/success
// @desc    Webhook/Callback hit by Aamarpay on successful payment (supports GET & POST)
// @access  Public (Aamarpay callback)
router.all('/success', async (req: any, res: Response) => {
  try {
    const params = { ...req.query, ...req.body };
    const orderId = params.orderId || req.query.orderId;
    const tranId = params.tranId || req.query.tranId;
    const payStatus = params.pay_status || params.status || 'Successful';

    console.log('[Aamarpay success callback]', { orderId, tranId, payStatus, params });

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed'; // Order shifts to Confirmed status upon payment
        await order.save();
        console.log(`[Order Paid Success] Order #${orderId} marked as Paid. Transaction: ${tranId}`);
      }
    }

    return res.redirect(`${FRONTEND_URL}/payment/success?orderId=${orderId || ''}&tranId=${tranId || ''}`);
  } catch (error: any) {
    console.error('[Aamarpay success webhook exception]', error);
    res.redirect(`${FRONTEND_URL}/payment/success`);
  }
});

// @route   ALL /api/payment/fail
// @desc    Webhook/Callback hit by Aamarpay on payment failure
// @access  Public (Aamarpay callback)
router.all('/fail', async (req: any, res: Response) => {
  try {
    const params = { ...req.query, ...req.body };
    const orderId = params.orderId || req.query.orderId;
    const tranId = params.tranId || req.query.tranId;

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'Failed';
        await order.save();
      }
    }

    return res.redirect(`${FRONTEND_URL}/payment/fail?orderId=${orderId || ''}&tranId=${tranId || ''}`);
  } catch (error: any) {
    console.error('[Aamarpay fail webhook exception]', error);
    res.redirect(`${FRONTEND_URL}/payment/fail?reason=exception`);
  }
});

// @route   ALL /api/payment/cancel
// @desc    Webhook/Callback hit by Aamarpay on payment cancel
// @access  Public (Aamarpay callback)
router.all('/cancel', async (req: any, res: Response) => {
  try {
    const params = { ...req.query, ...req.body };
    const orderId = params.orderId || req.query.orderId;
    const tranId = params.tranId || req.query.tranId;

    return res.redirect(`${FRONTEND_URL}/payment/fail?orderId=${orderId || ''}&reason=cancelled`);
  } catch (error: any) {
    console.error('[Aamarpay cancel webhook exception]', error);
    res.redirect(`${FRONTEND_URL}/payment/fail?reason=cancelled`);
  }
});

export default router;
