import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/config';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Socialync Pro Subscription',
              description: 'Unlimited social media posts across all platforms',
            },
            unit_amount: 300, // $3.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=subscription_success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: currentUser.email || undefined,
      client_reference_id: currentUser.uid,
      metadata: {
        userId: currentUser.uid,
      },
    });

    // Redirect to the Stripe Checkout page
    return NextResponse.redirect(session.url || new URL('/pricing', req.url));
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.redirect(
      new URL('/pricing?error=checkout_failed', req.url)
    );
  }
} 