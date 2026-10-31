import "server-only";
import Stripe from "stripe";

// $10 buys one group one season.
export const SEASON_PRICE_CENTS = 1000;

// Created lazily so builds don't need STRIPE_SECRET_KEY.
let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key);
  }
  return stripe;
}
