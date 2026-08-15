import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_mock", {
  apiVersion: "2026-04-22.dahlia",
});

export async function createStripeCheckoutSession(params: {
  amount: number;
  currency: string;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency,
          product_data: { name: `Commande SokoFlux #${params.orderId}` },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { orderId: params.orderId },
  });

  return { sessionId: session.id, url: session.url };
}
