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

// Get price list / details
router.get('/plans', (req, res) => {
  res.json({
    BASIC: { price: 9.99, resolution: '720p', screens: 1, quality: 'Good' },
    STANDARD: { price: 15.49, resolution: '1080p', screens: 2, quality: 'Better' },
    PREMIUM: { price: 22.99, resolution: '4K + HDR', screens: 4, quality: 'Best' }
  });
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
