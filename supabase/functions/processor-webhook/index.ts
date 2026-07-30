import Stripe from 'npm:stripe@18';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status });

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = request.headers.get('stripe-signature');
  if (!stripeKey || !webhookSecret) return json({ error: 'server_not_configured' }, 503);
  if (!signature) return json({ error: 'invalid_signature' }, 400);
  const rawBody = await request.text();
  try {
    const stripe = new Stripe(stripeKey);
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    // Webhooks reconcile processor facts only. They never decide verification outcomes
    // or initiate a capture; settlement remains gated by the server verification record.
    return json({ eventId: event.id, received: true });
  } catch {
    return json({ error: 'invalid_signature' }, 400);
  }
});
