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

    if (pkgs.length === 0) {
      const defaults = [
        {
          name: 'Daily Pass',
          slug: 'daily-pass',
          price: 2000,
          currency: 'UGX',
          interval: 'DAILY',
          description: 'Full 24-hour access to all VJ Luganda movies and series',
          features: 'Unlimited Streaming, 1 Screen, HD Quality, Luganda Translations',
          resolution: '1080p Full HD',
          screens: 1,
          isActive: true
        },
        {
          name: 'Weekly Special',
          slug: 'weekly-special',
          price: 7000,
          currency: 'UGX',
          interval: 'WEEKLY',
          description: '7 days unlimited streaming access across all devices',
          features: 'Unlimited Streaming, 2 Screens, HD Quality, All VJ Downloads',
          resolution: '1080p Full HD',
          screens: 2,
          isActive: true
        },
        {
          name: 'Monthly VIP',
          slug: 'monthly-vip',
          price: 20000,
          currency: 'UGX',
          interval: 'MONTHLY',
          description: '30 days VIP access with 4K Ultra HD & Multi-Screen',
          features: 'Unlimited Streaming, 4 Screens, 4K Ultra HD, Priority VJ Releases',
          resolution: '4K Ultra HD',
          screens: 4,
          isActive: true
        }
      ];

      for (const item of defaults) {
        const existing = await prisma.package.findFirst({ where: { slug: item.slug } });
        if (!existing) {
          await prisma.package.create({ data: item });
        }
      }

      pkgs = await prisma.package.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });
    }
    return pkgs;
  }

  // Fallback Raw SQL Query if PrismaClient model delegate is not cached
  try {
    const rawPkgs = await prisma.$queryRawUnsafe(`SELECT * FROM "Package" WHERE "isActive" = 1 ORDER BY "price" ASC`);
    return rawPkgs;
  } catch (err) {
    return [
      { id: 'def_daily', name: 'Daily Pass', slug: 'daily-pass', price: 2000, currency: 'UGX', interval: 'DAILY', description: 'Full 24-hour access', features: 'Unlimited Streaming, 1 Screen', resolution: '1080p Full HD', screens: 1, isActive: true },
      { id: 'def_weekly', name: 'Weekly Special', slug: 'weekly-special', price: 7000, currency: 'UGX', interval: 'WEEKLY', description: '7 days unlimited streaming', features: 'Unlimited Streaming, 2 Screens', resolution: '1080p Full HD', screens: 2, isActive: true },
      { id: 'def_monthly', name: 'Monthly VIP', slug: 'monthly-vip', price: 20000, currency: 'UGX', interval: 'MONTHLY', description: '30 days VIP access', features: 'Unlimited Streaming, 4 Screens, 4K Ultra HD', resolution: '4K Ultra HD', screens: 4, isActive: true }
    ];
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

    // If payment method is mobile money (or default) and LivePay API Key is configured
    if (paymentMethod === 'mobile_money' || (!paymentMethod && livepayApiKey)) {
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Mobile Money phone number is required' });
      }

      if (livepayApiKey && livepayAccountNumber && livepayEnabled) {
        // Construct unique reference (max 30 chars, no spaces)
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const reference = `LP_${timestamp}_${randomNum}`;

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
            return res.status(400).json({ error: errorMsg });
          }

          console.log('LivePay Collection successful:', lpData);
        } catch (lpErr) {
          console.error('Error connecting to LivePay API:', lpErr);
          return res.status(502).json({ error: 'Failed to reach LivePay server: ' + lpErr.message });
        }
      } else if (!livepayApiKey || !livepayAccountNumber) {
        // Demo fallback alert if Admin has not entered LivePay API key yet
        console.warn('LivePay API Key or Account Number not configured in Admin Dashboard yet.');
      }
    } else if (paymentMethod === 'card' && livepayApiKey && livepayAccountNumber && livepayEnabled) {
      // Calculate USD amount (min $1.00, max $5000.00)
      let usdAmount = 1.00;
      if (pkg.currency && pkg.currency.toUpperCase() === 'USD') {
        usdAmount = Math.max(1, Math.min(5000, Number(pkg.price)));
      } else {
        const converted = Number(pkg.price) / 3700;
        usdAmount = Math.max(1, Math.min(5000, Math.round(converted * 100) / 100));
      }

      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const reference = `LPC_${timestamp}_${randomNum}`;
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

      console.log(`Initiating LivePay Card Collection request to https://livepay.me/api/card-collection for $${usdAmount} USD...`);

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
          console.error('LivePay Card API Error:', lpCardData);
          return res.status(400).json({ error: errorMsg });
        }

        if (lpCardData.checkout_url) {
          return res.json({
            success: true,
            checkoutUrl: lpCardData.checkout_url,
            message: 'Redirecting to LivePay Card Checkout...'
          });
        }
      } catch (lpCardErr) {
        console.error('Error connecting to LivePay Card API:', lpCardErr);
        return res.status(502).json({ error: 'Failed to reach LivePay Card service: ' + lpCardErr.message });
      }
    }

    // Calculate dynamic expiration based on package interval (Value + Unit)
    const expiration = calculateExpirationDate(pkg.interval);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        plan: pkg.name,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: expiration,
        stripeCustomerId: 'pkg_cust_' + Math.random().toString(36).substring(7),
        stripeSubId: 'pkg_sub_' + Math.random().toString(36).substring(7)
      }
    });

    res.json({
      success: true,
      message: `Successfully subscribed to ${pkg.name}!`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        plan: updatedUser.plan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEnd: updatedUser.subscriptionEnd
      }
    });
  } catch (error) {
    console.error('Subscribe package error:', error);
    res.status(500).json({ error: 'Failed to process package subscription' });
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
