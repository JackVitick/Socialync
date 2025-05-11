import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe webhook secret is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get the user ID from the client_reference_id
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.error('No user ID in session');
          return NextResponse.json({ error: 'No user ID in session' }, { status: 400 });
        }
        
        // Store subscription info in Firestore
        await handleSubscriptionCreated(
          userId,
          session.subscription as string,
          session.customer as string
        );
        
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status in Firestore
        await updateSubscriptionStatus(
          subscription.id,
          subscription.status,
          subscription.current_period_end,
          subscription.cancel_at
        );
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as cancelled in Firestore
        await updateSubscriptionStatus(
          subscription.id,
          'canceled',
          subscription.current_period_end,
          null
        );
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to store subscription data in Firestore
async function handleSubscriptionCreated(
  userId: string,
  subscriptionId: string,
  customerId: string
) {
  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Store in Firestore
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    await setDoc(subscriptionRef, {
      userId,
      customerId,
      subscriptionId,
      plan: 'pro',
      status: subscription.status,
      createdAt: Timestamp.now(),
      currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at
        ? Timestamp.fromMillis(subscription.cancel_at * 1000)
        : null,
    });
    
    // Add subscription reference to user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        subscription: {
          id: subscriptionId,
          plan: 'pro',
          status: subscription.status,
          currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
        },
        postsRemaining: 'unlimited',
      });
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}

// Helper to update subscription status
async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string,
  currentPeriodEnd: number,
  cancelAt: number | null
) {
  try {
    // Update subscription document
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      const subscriptionData = subscriptionDoc.data();
      const userId = subscriptionData.userId;
      
      // Update subscription status
      await updateDoc(subscriptionRef, {
        status,
        currentPeriodEnd: Timestamp.fromMillis(currentPeriodEnd * 1000),
        cancelAt: cancelAt ? Timestamp.fromMillis(cancelAt * 1000) : null,
        updatedAt: Timestamp.now(),
      });
      
      // Update user's subscription reference
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'subscription.status': status,
        'subscription.currentPeriodEnd': Timestamp.fromMillis(currentPeriodEnd * 1000),
        postsRemaining: status === 'active' ? 'unlimited' : 5, // Revert to 5 posts if not active
      });
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
} 