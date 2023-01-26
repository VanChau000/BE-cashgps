import stripe from '../clients/stripe';

export const createCustomerStripe = async ({
  email,
  firstName,
  lastName
}: any) => {
  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`
  });
  return customer;
};

export const retrieveSubscription = async (subId: string) =>
  await stripe.subscriptions.retrieve(subId);

export const constructEvent = async (req: any) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET as string
  );
  return event;
};
