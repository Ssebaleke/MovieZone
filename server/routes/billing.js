import express from 'express';
import Stripe from 'stripe';
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
    return await prisma.transaction.create({ data });
  }
  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Transaction" ("id", "userId", "email", "phoneNumber", "packageId", "packageName", "amount", "currency", "paymentMethod", "reference", "status", "errorMessage", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    id, data.userId || null, data.email, data.phoneNumber || null, data.packageId || null, data.packageName,
    data.amount, data.currency || 'UGX', data.paymentMethod || 'mobile_money', data.reference, data.status || 'PENDING', data.errorMessage || null
  );
  return { id, ...data };
}

async function safeUpdateTransaction(id, data) {
  if (prisma.transaction) {
    return await prisma.transaction.update({ where: { id }, data });
  }
  const setParts = [];
  const params = [];
  let idx = 1;

  if (data.status !== undefined) { setParts.push(`"status" = $${idx++}`); params.push(data.status); }
  if (data.livepayRef !== undefined) { setParts.push(`"livepayRef" = $${idx++}`); params.push(data.livepayRef); }
  if (data.errorMessage !== undefined) { setParts.push(`"errorMessage" = $${idx++}`); params.push(data.errorMessage); }
  setParts.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  params.push(id);

  if (setParts.length > 1) {
    await prisma.$executeRawUnsafe(`UPDATE "Transaction" SET ${setParts.join(', ')} WHERE "id" = $${idx}`, ...params);
  }
  return { id, ...data };
}

async function safeFindTransactionByRef(reference) {
  if (prisma.transaction) {
    return await prisma.transaction.findUnique({ where: { reference } });
  }
  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "Transaction" WHERE "reference" = $1 LIMIT 1`, reference);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// Process dynamic package payment checkout (Mobile Money via LivePay / Card)
router.post('/subscribe-package', authenticateToken, async (req, res) => {
  const { packageId, paymentMethod, phoneNumber, network } = req.body;

  if (!packageId) {
    return res.status(400).json({ error: 'Package ID is required' });
  }

  try {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!pkg || !pkg.isActive) {
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
    console.error('Subscribe package error:', error);
    res.status(500).json({ error: 'Failed to process package subscription' });
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

// LivePay Webhook / Callback endpoint
router.post('/livepay-callback', async (req, res) => {
  const body = req.body || {};
  const reference = body.reference || body.tx_ref || body.reference_id || body.ref;
  const status = body.status || body.payment_status || body.transaction_status;
  const livepayRef = body.livepayRef || body.transactionId || body.transaction_id || body.tx_id;
  const errorMessage = body.errorMessage || body.message || body.error || null;

  console.log('Received LivePay Webhook Callback:', { reference, status, livepayRef, errorMessage });

  // Verify Webhook Secret if configured by Admin
  try {
    const secretSetting = await prisma.systemSetting.findUnique({ where: { key: 'LIVEPAY_WEBHOOK_SECRET' } });
    if (secretSetting && secretSetting.value && secretSetting.value.trim()) {
      const expectedSecret = secretSetting.value.trim();
      const providedSecret = req.headers['x-livepay-secret'] || req.headers['x-webhook-secret'] || req.query.secret || body.secret || body.webhook_secret;

      if (providedSecret && providedSecret.trim() !== expectedSecret) {
        console.warn('Webhook secret verification failed for reference:', reference);
        return res.status(401).json({ error: 'Invalid webhook verification secret' });
      }
    }
  } catch (sErr) {}

  if (!reference) {
    return res.json({ success: false, message: 'Missing transaction reference' });
  }

  try {
    const tx = await safeFindTransactionByRef(reference);

    if (!tx) {
      console.warn('Webhook callback received for unknown reference:', reference);
      return res.status(404).json({ error: 'Transaction not found for reference ' + reference });
    }

    const isSuccess = String(status).toUpperCase() === 'SUCCESS' || String(status).toUpperCase() === 'COMPLETED' || String(status).toUpperCase() === 'SUCCESSFUL';
    const isFailed = String(status).toUpperCase() === 'FAILED' || String(status).toUpperCase() === 'CANCELLED' || String(status).toUpperCase() === 'DECLINED';

    if (isSuccess) {
      await safeUpdateTransaction(tx.id, { status: 'SUCCESS', livepayRef: livepayRef || tx.livepayRef });

      if (tx.userId) {
        let pkg = null;
        if (tx.packageId) {
          pkg = await prisma.package.findUnique({ where: { id: tx.packageId } }).catch(() => null);
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
      }
    } else if (isFailed) {
      await safeUpdateTransaction(tx.id, { status: 'FAILED', errorMessage: errorMessage || 'Payment declined or cancelled' });
    }

    res.json({
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
