import express from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripeInstance = null;
if (stripeSecret) {
  stripeInstance = new Stripe(stripeSecret);
}

// Calculate dynamic subscription end date from value + unit string (e.g. "12_HOURS", "3_DAYS", "30_DAYS", "1_YEARS")
function calculateExpirationDate(intervalStr) {
  const now = new Date();
  const expiration = new Date(now);

  if (!intervalStr) {
    expiration.setMonth(expiration.getMonth() + 1);
    return expiration;
  }

  const str = String(intervalStr).toUpperCase().trim();

  // Parse pattern like "12_HOURS", "45_MINUTES", "3_DAYS", "2_WEEKS", "6_MONTHS", "1_YEARS"
  const match = str.match(/^(\d+)[_\s:]*([A-Z]+)$/);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];

    if (val === 0) {
      // 0 means unlimited duration / 100 years
      expiration.setFullYear(expiration.getFullYear() + 100);
      return expiration;
    }

    if (unit.startsWith('MIN')) {
      expiration.setMinutes(expiration.getMinutes() + val);
    } else if (unit.startsWith('HOUR') || unit.startsWith('HR')) {
      expiration.setHours(expiration.getHours() + val);
    } else if (unit.startsWith('DAY')) {
      expiration.setDate(expiration.getDate() + val);
    } else if (unit.startsWith('WEEK')) {
      expiration.setDate(expiration.getDate() + (val * 7));
    } else if (unit.startsWith('MONTH')) {
      expiration.setMonth(expiration.getMonth() + val);
    } else if (unit.startsWith('YEAR')) {
      expiration.setFullYear(expiration.getFullYear() + val);
    } else {
      expiration.setMonth(expiration.getMonth() + 1);
    }
    return expiration;
  }

  // Legacy fallback strings
  switch (str) {
    case 'DAILY': expiration.setDate(expiration.getDate() + 1); break;
    case 'WEEKLY': expiration.setDate(expiration.getDate() + 7); break;
    case 'MONTHLY': expiration.setMonth(expiration.getMonth() + 1); break;
    case 'YEARLY': expiration.setFullYear(expiration.getFullYear() + 1); break;
    default: expiration.setMonth(expiration.getMonth() + 1); break;
  }

  return expiration;
}

// Get price list / details (Legacy plans)
router.get('/plans', (req, res) => {
  res.json({
    BASIC: { price: 9.99, resolution: '720p', screens: 1, quality: 'Good' },
    STANDARD: { price: 15.49, resolution: '1080p', screens: 2, quality: 'Better' },
    PREMIUM: { price: 22.99, resolution: '4K + HDR', screens: 4, quality: 'Best' }
  });
});

// Safe Package Model helper to prevent undefined delegate errors
async function fetchActivePackages() {
  if (prisma.package) {
    let pkgs = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    return pkgs;
  }

  try {
    const rawPkgs = await prisma.$queryRawUnsafe(`SELECT * FROM "Package" WHERE "isActive" = 1 ORDER BY "price" ASC`);
    return rawPkgs;
  } catch (err) {
    return [];
  }
}

// Get all active Admin packages for frontend checkout
router.get('/packages', async (req, res) => {
  try {
    const packages = await fetchActivePackages();
    res.json(packages);
  } catch (error) {
    console.error('Error fetching billing packages:', error);
    res.status(500).json({ error: 'Failed to load packages: ' + error.message });
  }
});

// Safe Transaction DB Helpers to prevent undefined delegate issues
async function safeCreateTransaction(data) {
  if (prisma.transaction) {
    try {
      return await prisma.transaction.create({ data });
    } catch (e) {
      console.warn('prisma.transaction.create failed, fallback to raw sql:', e.message);
    }
  }
  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Transaction" ("id", "userId", "email", "phoneNumber", "packageId", "packageName", "amount", "currency", "paymentMethod", "reference", "status", "errorMessage", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id, data.userId || null, data.email, data.phoneNumber || null, data.packageId || null, data.packageName,
      data.amount, data.currency || 'UGX', data.paymentMethod || 'mobile_money', data.reference, data.status || 'PENDING', data.errorMessage || null
    );
    return { id, ...data };
  } catch (e) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO transaction (id, "userId", email, "phoneNumber", "packageId", "packageName", amount, currency, "paymentMethod", reference, status, "errorMessage", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id, data.userId || null, data.email, data.phoneNumber || null, data.packageId || null, data.packageName,
      data.amount, data.currency || 'UGX', data.paymentMethod || 'mobile_money', data.reference, data.status || 'PENDING', data.errorMessage || null
    );
    return { id, ...data };
  }
}

async function safeUpdateTransaction(id, data) {
  if (prisma.transaction) {
    try {
      return await prisma.transaction.update({ where: { id }, data });
    } catch (e) {}
  }
  const setPartsQuoted = [];
  const setPartsUnquoted = [];
  const params = [];
  let idx = 1;

  if (data.status !== undefined) { 
    setPartsQuoted.push(`"status" = $${idx}`); 
    setPartsUnquoted.push(`status = $${idx}`); 
    params.push(data.status); 
    idx++; 
  }
  if (data.livepayRef !== undefined) { 
    setPartsQuoted.push(`"livepayRef" = $${idx}`); 
    setPartsUnquoted.push(`livepayref = $${idx}`); 
    params.push(data.livepayRef); 
    idx++; 
  }
  if (data.errorMessage !== undefined) { 
    setPartsQuoted.push(`"errorMessage" = $${idx}`); 
    setPartsUnquoted.push(`errormessage = $${idx}`); 
    params.push(data.errorMessage); 
    idx++; 
  }
  setPartsQuoted.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  setPartsUnquoted.push(`updatedat = CURRENT_TIMESTAMP`);
  params.push(id);

  if (setPartsQuoted.length > 1) {
    try {
      await prisma.$executeRawUnsafe(`UPDATE "Transaction" SET ${setPartsQuoted.join(', ')} WHERE "id" = $${idx}`, ...params);
    } catch (e) {
      await prisma.$executeRawUnsafe(`UPDATE transaction SET ${setPartsUnquoted.join(', ')} WHERE id = $${idx}`, ...params);
    }
  }
  return { id, ...data };
}

async function safeFindTransactionByRef(reference) {
  if (!reference) return null;
  if (prisma.transaction) {
    try {
      const tx = await prisma.transaction.findUnique({ where: { reference } });
      if (tx) return tx;
    } catch (e) {}
  }
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "Transaction" WHERE "reference" = $1 LIMIT 1`, reference);
    if (Array.isArray(rows) && rows.length > 0) return rows[0];
  } catch (e) {}
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM transaction WHERE reference = $1 LIMIT 1`, reference);
    if (Array.isArray(rows) && rows.length > 0) return rows[0];
  } catch (e) {}
  return null;
}

// Process dynamic package payment checkout (Mobile Money via LivePay / Card)
router.post('/subscribe-package', authenticateToken, async (req, res) => {
  const { packageId, paymentMethod, phoneNumber, network } = req.body;

  if (!packageId) {
    return res.status(400).json({ error: 'Package ID is required' });
  }

  try {
    let pkg = null;
    if (prisma.package) {
      pkg = await prisma.package.findFirst({
        where: {
          OR: [
            { id: String(packageId) },
            { slug: String(packageId) }
          ]
        }
      }).catch(() => null);
    }
    if (!pkg) {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "Package" WHERE "id" = $1 OR "slug" = $1 LIMIT 1`, String(packageId)).catch(() => []);
      if (Array.isArray(rows) && rows.length > 0) {
        pkg = rows[0];
      }
    }

    if (!pkg || (pkg.isActive === false || pkg.isActive === 0)) {
      return res.status(404).json({ error: 'Selected subscription package is invalid or inactive' });
    }

    // Generate unique reference for transaction logging
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const reference = `LP_${timestamp}_${randomNum}`;

    // Create PENDING transaction record
    let transaction = await safeCreateTransaction({
      userId: req.user.id,
      email: req.user.email,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
      packageId: pkg.id,
      packageName: pkg.name,
      amount: pkg.price,
      currency: pkg.currency || 'UGX',
      paymentMethod: paymentMethod || 'mobile_money',
      reference: reference,
      status: 'PENDING'
    });

    // Fetch LivePay credentials from SystemSetting
    let livepayApiKey = '';
    let livepayAccountNumber = '';
    let livepayEnabled = true;

    try {
      if (prisma.systemSetting) {
        const allSettings = await prisma.systemSetting.findMany({
          where: {
            key: { in: ['LIVEPAY_API_KEY', 'LIVEPAY_ACCOUNT_NUMBER', 'LIVEPAY_ENABLED'] }
          }
        });
        allSettings.forEach(s => {
          if (s.key === 'LIVEPAY_API_KEY') livepayApiKey = s.value ? s.value.trim() : '';
          if (s.key === 'LIVEPAY_ACCOUNT_NUMBER') livepayAccountNumber = s.value ? s.value.trim() : '';
          if (s.key === 'LIVEPAY_ENABLED') livepayEnabled = s.value !== 'false';
        });
      } else {
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "SystemSetting" WHERE "key" IN ('LIVEPAY_API_KEY', 'LIVEPAY_ACCOUNT_NUMBER', 'LIVEPAY_ENABLED')`).catch(() => []);
        if (Array.isArray(rows)) {
          rows.forEach(s => {
            if (s.key === 'LIVEPAY_API_KEY') livepayApiKey = s.value ? s.value.trim() : '';
            if (s.key === 'LIVEPAY_ACCOUNT_NUMBER') livepayAccountNumber = s.value ? s.value.trim() : '';
            if (s.key === 'LIVEPAY_ENABLED') livepayEnabled = s.value !== 'false';
          });
        }
      }
    } catch (sErr) {
      console.warn('SystemSetting lookup error:', sErr.message);
    }

    // If payment method is mobile money (or default)
    if (paymentMethod === 'mobile_money' || (!paymentMethod && livepayApiKey)) {
      if (!phoneNumber) {
        await safeUpdateTransaction(transaction.id, { status: 'FAILED', errorMessage: 'Mobile Money phone number is required' });
        return res.status(400).json({ error: 'Mobile Money phone number is required' });
      }

      if (livepayApiKey && livepayAccountNumber && livepayEnabled) {
        const collectPayload = {
          accountNumber: livepayAccountNumber,
          phoneNumber: phoneNumber.trim(),
          amount: pkg.price,
          currency: pkg.currency || 'UGX',
          reference: reference,
          description: `MovieZone ${pkg.name}`
        };

        if (pkg.currency && pkg.currency.toUpperCase() !== 'UGX') {
          collectPayload.network = network || 'GLOBAL';
        }

        console.log(`Initiating LivePay Collection request to https://livepay.me/api/collect-money for ${pkg.name} (${pkg.price} ${pkg.currency})...`);

        try {
          const lpResponse = await fetch('https://livepay.me/api/collect-money', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${livepayApiKey}`
            },
            body: JSON.stringify(collectPayload)
          });

          const lpData = await lpResponse.json();

          if (!lpResponse.ok || lpData.success === false) {
            const errorMsg = lpData.message || lpData.error || `LivePay transaction failed (${lpResponse.status})`;
            console.error('LivePay API Error:', lpData);

            await safeUpdateTransaction(transaction.id, { status: 'FAILED', errorMessage: errorMsg });
            return res.status(400).json({ error: errorMsg, reference });
          }

          console.log('LivePay Collection response:', lpData);

          // Update transaction with LivePay reference if returned
          const livepayRef = lpData.reference || lpData.transactionId || lpData.tx_ref || null;
          const isInstantSuccess = lpData.status === 'SUCCESS' || lpData.status === 'COMPLETED' || lpData.payment_status === 'SUCCESS';

          if (isInstantSuccess) {
            const expiration = calculateExpirationDate(pkg.interval);
            const updatedUser = await prisma.user.update({
              where: { id: req.user.id },
              data: {
                plan: pkg.name,
                subscriptionStatus: 'ACTIVE',
                subscriptionEnd: expiration
              }
            });

            await safeUpdateTransaction(transaction.id, { status: 'SUCCESS', livepayRef });

            return res.json({
              success: true,
              status: 'SUCCESS',
              message: `Payment successful! Subscription to ${pkg.name} activated.`,
              reference,
              user: {
                id: updatedUser.id,
                email: updatedUser.email,
                plan: updatedUser.plan,
                subscriptionStatus: updatedUser.subscriptionStatus,
                subscriptionEnd: updatedUser.subscriptionEnd
              }
            });
          } else {
            // Mobile Money prompt sent to phone - awaiting PIN / Admin approval
            await safeUpdateTransaction(transaction.id, { livepayRef });

            return res.json({
              success: true,
              status: 'PENDING',
              reference,
              message: `Mobile Money prompt sent to ${phoneNumber}. Please enter your PIN on your phone. Access will be activated once payment is confirmed.`,
              user: req.user
            });
          }
        } catch (lpErr) {
          console.error('Error connecting to LivePay API:', lpErr);
          await safeUpdateTransaction(transaction.id, { status: 'FAILED', errorMessage: 'Failed to reach LivePay server: ' + lpErr.message });
          return res.status(502).json({ error: 'Failed to reach LivePay server: ' + lpErr.message });
        }
      } else {
        // LivePay credentials not configured, log as PENDING for admin review
        return res.json({
          success: true,
          status: 'PENDING',
          reference,
          message: 'Subscription request received! Awaiting payment confirmation on admin portal.',
          user: req.user
        });
      }
    } else if (paymentMethod === 'card' && livepayApiKey && livepayAccountNumber && livepayEnabled) {
      let usdAmount = 1.00;
      if (pkg.currency && pkg.currency.toUpperCase() === 'USD') {
        usdAmount = Math.max(1, Math.min(5000, Number(pkg.price)));
      } else {
        const converted = Number(pkg.price) / 3700;
        usdAmount = Math.max(1, Math.min(5000, Math.round(converted * 100) / 100));
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      const cardPayload = {
        accountNumber: livepayAccountNumber,
        amount: usdAmount,
        currency: 'USD',
        reference: reference,
        email: req.user.email,
        name: req.user.email ? req.user.email.split('@')[0] : 'Customer',
        description: `MovieZone ${pkg.name} Subscription`,
        return_url: `${clientUrl}/account?checkout=success`
      };

      try {
        const lpCardRes = await fetch('https://livepay.me/api/card-collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${livepayApiKey}`
          },
          body: JSON.stringify(cardPayload)
        });

        const lpCardData = await lpCardRes.json();

        if (!lpCardRes.ok || lpCardData.success === false) {
          const errorMsg = lpCardData.message || lpCardData.error || `LivePay Card Collection failed (${lpCardRes.status})`;
          await safeUpdateTransaction(transaction.id, { status: 'FAILED', errorMessage: errorMsg });
          return res.status(400).json({ error: errorMsg });
        }

        if (lpCardData.checkout_url) {
          return res.json({
            success: true,
            status: 'PENDING',
            reference,
            checkoutUrl: lpCardData.checkout_url,
            message: 'Redirecting to LivePay Card Checkout...'
          });
        }
      } catch (lpCardErr) {
        await safeUpdateTransaction(transaction.id, { status: 'FAILED', errorMessage: lpCardErr.message });
        return res.status(502).json({ error: 'Failed to reach LivePay Card service: ' + lpCardErr.message });
      }
    }

    return res.json({
      success: true,
      status: 'PENDING',
      reference,
      message: 'Subscription request recorded. Awaiting payment confirmation.',
      user: req.user
    });
  } catch (error) {
    console.error('Subscribe package error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to process package subscription: ' + error.message });
  }
});

// Check transaction status by reference
router.get('/transaction-status/:reference', authenticateToken, async (req, res) => {
  const { reference } = req.params;
  try {
    const tx = await safeFindTransactionByRef(reference);

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Fetch user current status
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, plan: true, subscriptionStatus: true, subscriptionEnd: true }
    });

    res.json({
      transaction: tx,
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking transaction status' });
  }
});

// Helper function for official LivePay Webhook Signature Verification
function verifyLivePayWebhookSignature(payload, signatureHeader, webhookUrl, secret) {
  if (!signatureHeader || !secret) return true;
  try {
    const parts = signatureHeader.split(',');
    let timestamp = '';
    let receivedSignature = '';
    for (const part of parts) {
      const p = part.trim();
      if (p.startsWith('t=')) timestamp = p.split('=')[1];
      if (p.startsWith('v=')) receivedSignature = p.split('=')[1];
    }

    const params = {
      status: payload.status,
      customer_reference: payload.customer_reference,
      internal_reference: payload.internal_reference
    };

    const sortedKeys = Object.keys(params).sort();
    let stringToSign = webhookUrl + timestamp;
    for (const key of sortedKeys) {
      stringToSign += key + (params[key] !== undefined && params[key] !== null ? params[key] : '');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');

    return receivedSignature === expectedSignature;
  } catch (err) {
    console.error('Error verifying LivePay signature:', err);
    return false;
  }
}

// LivePay Webhook / Callback endpoint (supports POST, GET, etc.)
router.all('/livepay-callback', async (req, res) => {
  const body = req.body || {};
  const query = req.query || {};

  // Extract reference according to official LivePay Webhook spec
  const reference = body.customer_reference || body.reference || body.tx_ref || body.reference_id || body.ref || body.internal_reference || query.customer_reference || query.reference || query.ref;
  const rawStatus = body.status || body.payment_status || body.transaction_status || body.code || query.status || query.payment_status;
  const livepayRef = body.provider_transaction_id || body.internal_reference || body.livepayRef || body.transactionId || body.tx_id || query.provider_transaction_id || query.livepayRef;
  const errorMessage = body.message || body.errorMessage || body.error || query.message || null;

  console.log('Received LivePay Official Webhook Callback:', {
    reference,
    rawStatus,
    livepayRef,
    customer_reference: body.customer_reference,
    internal_reference: body.internal_reference,
    provider_transaction_id: body.provider_transaction_id,
    msisdn: body.msisdn,
    amount: body.amount
  });

  // Signature Verification using X-Webhook-Signature header
  try {
    let webhookSecret = '';
    const secretSetting = await prisma.systemSetting.findFirst({ where: { key: 'LIVEPAY_WEBHOOK_SECRET' } }).catch(() => null);
    if (secretSetting && secretSetting.value && secretSetting.value.trim()) {
      webhookSecret = secretSetting.value.trim();
    }

    const sigHeader = req.headers['x-webhook-signature'] || req.headers['x-livepay-signature'] || req.headers['x-webhook-secret'];
    if (webhookSecret && sigHeader) {
      const fullWebhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;
      const isValidSig = verifyLivePayWebhookSignature(body, sigHeader, fullWebhookUrl, webhookSecret);
      if (!isValidSig) {
        console.warn('LivePay HMAC Signature Verification Failed for ref:', reference);
        return res.status(401).json({ error: 'Invalid LivePay webhook signature' });
      }
    }
  } catch (sErr) {
    console.warn('Webhook signature check exception:', sErr.message);
  }

  if (!reference) {
    return res.json({ success: false, message: 'Missing customer reference' });
  }

  try {
    const tx = await safeFindTransactionByRef(reference);

    if (!tx) {
      console.warn('Webhook callback received for reference not found in DB:', reference);
      // Return 200 OK as required by LivePay docs so LivePay does not keep retrying unknown test refs
      return res.status(200).json({ success: false, message: 'Transaction not found for reference ' + reference });
    }

    const statusStr = String(rawStatus || '').toUpperCase().trim();
    const isSuccess = ['SUCCESS', 'COMPLETED', 'SUCCESSFUL', 'PAID', '00', '200', 'TRUE', '1', 'APPROVED'].includes(statusStr);
    const isFailed = ['FAILED', 'CANCELLED', 'DECLINED', 'REJECTED', 'EXPIRED', 'ERROR'].includes(statusStr);

    if (isSuccess) {
      await safeUpdateTransaction(tx.id, { status: 'SUCCESS', livepayRef: livepayRef || tx.livepayRef });

      if (tx.userId) {
        let pkg = null;
        if (tx.packageId) {
          pkg = await prisma.package.findFirst({
            where: { OR: [{ id: String(tx.packageId) }, { slug: String(tx.packageId) }] }
          }).catch(() => null);
        }
        const expiration = calculateExpirationDate(pkg?.interval || '30_DAYS');

        await prisma.user.update({
          where: { id: tx.userId },
          data: {
            plan: tx.packageName,
            subscriptionStatus: 'ACTIVE',
            subscriptionEnd: expiration
          }
        });
        console.log(`[AUTOMATIC ACTIVATION SUCCESS] Granted ACTIVE premium access to user ${tx.userId} for plan ${tx.packageName}!`);
      }
    } else if (isFailed) {
      await safeUpdateTransaction(tx.id, { status: 'FAILED', errorMessage: errorMessage || 'Payment declined or cancelled' });
    }

    // Must return 200 OK within 10 seconds as required by LivePay official documentation
    res.status(200).json({
      success: true,
      message: 'Callback processed successfully',
      reference,
      status: isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'PENDING'
    });
  } catch (error) {
    console.error('Error processing LivePay callback:', error);
    res.status(500).json({ error: 'Failed to process callback: ' + error.message });
  }
});

// Create checkout session (Stripe or Mock fallback)
router.post('/checkout', authenticateToken, async (req, res) => {
  const { plan } = req.body;
  
  if (!['BASIC', 'STANDARD', 'PREMIUM'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  try {
    if (stripeInstance) {
      // Setup Stripe checkout session
      // Map plans to Stripe price IDs (should be set in env or dynamic)
      // Note: for this deployment, we can configure a dynamic Stripe product or lookup price
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Netflix ${plan} Plan`,
                description: `Unlimited movies and TV shows on ${plan} plan.`
              },
              unit_amount: plan === 'BASIC' ? 999 : plan === 'STANDARD' ? 1549 : 2299,
              recurring: { interval: 'month' }
            },
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${clientUrl}/account?checkout=success&plan=${plan}`,
        cancel_url: `${clientUrl}/signup/plans?checkout=cancel`,
        customer_email: req.user.email,
        metadata: {
          userId: req.user.id,
          plan: plan
        }
      });

      res.json({ url: session.url, stripeEnabled: true });
    } else {
      // Stripe is NOT configured, tell the client to use the local mock checkout form
      res.json({ mockEnabled: true, plan });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Error generating checkout session' });
  }
});

// Process simulated credit card checkout locally when Stripe is disabled
router.post('/mock-checkout', authenticateToken, async (req, res) => {
  const { plan, cardNumber, expiry, cvc } = req.body;

  if (!plan || !cardNumber || !expiry || !cvc) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  // Basic mock check: simulate card validation (e.g. standard check length)
  if (cardNumber.replace(/\s/g, '').length < 12) {
    return res.status(400).json({ error: 'Invalid card number format' });
  }

  try {
    // Update local database to active subscription status
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + 1); // 1 month validity

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        plan,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: expiration,
        stripeCustomerId: 'mock_cust_' + Math.random().toString(36).substring(7),
        stripeSubId: 'mock_sub_' + Math.random().toString(36).substring(7)
      }
    });

    res.json({
      success: true,
      message: 'Mock subscription activated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        plan: updatedUser.plan,
        subscriptionStatus: updatedUser.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Mock checkout error:', error);
    res.status(500).json({ error: 'Server error processing mock payment' });
  }
});

// Cancel subscription (Stripe or Mock)
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.subscriptionStatus !== 'ACTIVE') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    if (stripeInstance && user.stripeSubId && !user.stripeSubId.startsWith('mock_')) {
      // Cancel Stripe Subscription
      await stripeInstance.subscriptions.update(user.stripeSubId, {
        cancel_at_period_end: true
      });
      
      // Update database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'CANCELED'
        }
      });
    } else {
      // Mock Cancel
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'CANCELED'
        }
      });
    }

    res.json({ success: true, message: 'Subscription cancelled successfully at end of billing cycle' });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ error: 'Error processing cancellation' });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.subscriptionStatus !== 'CANCELED') {
      return res.status(400).json({ error: 'Subscription is not in a cancelled state' });
    }

    if (stripeInstance && user.stripeSubId && !user.stripeSubId.startsWith('mock_')) {
      // Reactivate on Stripe
      await stripeInstance.subscriptions.update(user.stripeSubId, {
        cancel_at_period_end: false
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'ACTIVE'
      }
    });

    res.json({ success: true, message: 'Subscription successfully reactivated' });
  } catch (error) {
    console.error('Reactivation error:', error);
    res.status(500).json({ error: 'Error reactivating subscription' });
  }
});

// Stripe webhook endpoint (for live production events)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeInstance || !sig || !endpointSecret) {
    return res.status(400).send('Webhook Secret or Stripe not configured');
  }

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;
        const stripeCustomerId = session.customer;
        const stripeSubId = session.subscription;

        const stripeSub = await stripeInstance.subscriptions.retrieve(stripeSubId);
        const subscriptionEnd = new Date(stripeSub.current_period_end * 1000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subscriptionStatus: 'ACTIVE',
            subscriptionEnd,
            stripeCustomerId,
            stripeSubId
          }
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const stripeSubId = invoice.subscription;
          const stripeSub = await stripeInstance.subscriptions.retrieve(stripeSubId);
          const subscriptionEnd = new Date(stripeSub.current_period_end * 1000);

          const dbUser = await prisma.user.findFirst({
            where: { stripeSubId }
          });

          if (dbUser) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                subscriptionStatus: 'ACTIVE',
                subscriptionEnd
              }
            });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        const dbUser = await prisma.user.findFirst({
          where: { stripeSubId: stripeSub.id }
        });

        if (dbUser) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              subscriptionStatus: 'INACTIVE',
              plan: 'NONE'
            }
          });
        }
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook database error:', error);
    res.status(500).json({ error: 'Server error processing webhook event' });
  }
});

export default router;
