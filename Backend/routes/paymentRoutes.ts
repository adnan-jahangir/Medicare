import express, { Response } from 'express';
import axios from 'axios';
import { Order } from '../models.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aamarpay Credentials from Environment Variables (with sandboxed defaults)
const STORE_ID = process.env.AMARPAY_STORE_ID || 'aamarpaytest';
const SIGNATURE_KEY = process.env.AMARPAY_SIGNATURE_KEY || 'db78d101d480e84ba286b6c9ecc9e228';
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
    const response = await axios.post(AMARPAY_API_URL, paymentPayload);

    if (response.data && response.data.payment_url) {
      return res.json({
        success: true,
        url: response.data.payment_url,
        tranId
      });
    } else {
      console.error('[Aamarpay error]', response.data);
      return res.status(500).json({
        success: false,
        message: 'Aamarpay payment initiation failed',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('[Aamarpay exception]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payment/success
// @desc    Webhook/Callback hit by Aamarpay on successful payment
// @access  Public (Aamarpay callback)
router.post('/success', async (req: any, res: Response) => {
  try {
    const { orderId, tranId } = req.query;
    const paymentData = req.body;

    console.log('[Aamarpay success callback]', { orderId, tranId, paymentData });

    // Validate pay_status sent by Aamarpay
    if (paymentData.pay_status === 'Successful') {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send('Order not found');
      }

      // Update Order Status atomically
      order.paymentStatus = 'Paid';
      order.status = 'Confirmed'; // Order shifts to Confirmed status upon payment
      await order.save();

      console.log(`[Order Paid Success] Order #${orderId} marked as Paid. Transaction: ${tranId}`);

      // Perform a server-side redirect back to the frontend success screen
      return res.redirect(`${FRONTEND_URL}/payment/success?orderId=${orderId}&tranId=${tranId}`);
    } else {
      console.error('[Aamarpay callback status invalid]', paymentData);
      return res.redirect(`${FRONTEND_URL}/payment/fail?orderId=${orderId}&reason=invalid_status`);
    }
  } catch (error: any) {
    console.error('[Aamarpay success webhook exception]', error);
    res.status(500).send('Internal Server Error');
  }
});

// @route   POST /api/payment/fail
// @desc    Webhook/Callback hit by Aamarpay on payment failure
// @access  Public (Aamarpay callback)
router.post('/fail', async (req: any, res: Response) => {
  try {
    const { orderId, tranId } = req.query;
    console.log('[Aamarpay fail callback]', { orderId, tranId, body: req.body });

    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'Failed';
      await order.save();
    }

    return res.redirect(`${FRONTEND_URL}/payment/fail?orderId=${orderId}&tranId=${tranId}`);
  } catch (error: any) {
    console.error('[Aamarpay fail webhook exception]', error);
    res.redirect(`${FRONTEND_URL}/payment/fail?reason=exception`);
  }
});

// @route   POST /api/payment/cancel
// @desc    Webhook/Callback hit by Aamarpay on payment cancel
// @access  Public (Aamarpay callback)
router.post('/cancel', async (req: any, res: Response) => {
  try {
    const { orderId, tranId } = req.query;
    console.log('[Aamarpay cancel callback]', { orderId, tranId });

    return res.redirect(`${FRONTEND_URL}/payment/fail?orderId=${orderId}&reason=cancelled`);
  } catch (error: any) {
    console.error('[Aamarpay cancel webhook exception]', error);
    res.redirect(`${FRONTEND_URL}/payment/fail?reason=exception`);
  }
});

export default router;
