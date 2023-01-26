import { ApolloError } from 'apollo-server-express';
import { Response } from 'express';
import stripe from '../clients/stripe';
import SubscriptionModel from '../models/subscription.model';
import AuthService from '../services/auth.service';
import SubscriptionService from '../services/subscription.service';
import { constructEvent } from '../utils/stripe';

export default class PaymentController {
  /**
   * checkout Session
   * @param req @any
   * @param res @Response
   */
  static checkoutSession = async (req: any, res: Response) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.status(200).json(session);
  };

  /**
   * create Checkout Session
   * @param req @any
   * @param res @Response
   * @returns {
   *    code: @number,
   *    url: @string
   * }
   */
  static createCheckoutSession = async (req: any, res: Response) => {
    const clientUrl = process.env.CLIENT_URL;

    const { priceId, customerId } = req.body;

    // check the current active subscription
    const activeSubscription =
      await AuthService.getActiveSubscriptionByCustomerId(customerId);

    if (activeSubscription && activeSubscription !== 'TRIAL') {
      // cancel current plan
      const subscriptionId =
        await SubscriptionModel.getSubscriptionIdByCustomerId(customerId);

      // delete subscription immediately
      stripe.subscriptions.del(subscriptionId);
    }

    // Create new Checkout Session for the order
    try {
      const session: any = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${clientUrl}/successPayment?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/canceledPayment`
        // automatic_tax: { enabled: true }
      });
      return res.json({ code: 303, url: session.url });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  static stripeConfig = async (req: any, res: Response) => {
    res.status(200).json({
      publishableKey: process.env.STRIPE_PK
    });
  };

  static historyPayment = async (req: any, res: Response) => {
    // get customer id from body

    const { customerId } = req.body;

    // Retrieve a list of charges for the customer
    const charges = await stripe.charges.list({ customer: customerId });

    // Send the list of charges and invoice as the response
    const listPayment = charges.data;
    const listInvoice = listPayment.map((item: any) => item.invoice);

    // get list invoices of payment
    const getListResultVoices = await Promise.all(
      listInvoice.map(
        async (invoice: any) => await stripe.invoices.retrieve(invoice)
      )
    );

    // get list result of each invoices
    const dataOfEachInvoice = getListResultVoices.map(
      (data: any) => data.lines.data
    );

    res.send(dataOfEachInvoice);
  };

  static customerPortal = async (req: any, res: Response) => {
    // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
    // Typically this is stored alongside the authenticated user in your database.
    const { sessionId } = req.body;
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = process.env.CLIENT_URL;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer as any,
      return_url: returnUrl
    });

    res.json({ code: 303, url: portalSession.url });
  };

  /**
   * handle listening webhooks
   * @param req @any
   * @param res @Response
   * @returns {}
   */
  static webhooks = async (req: any, res: Response) => {
    let event: any;
    try {
      // construct stripe event
      event = await constructEvent(req);
    } catch (error) {
      console.log(error);
      console.log('⚠️  Webhook signature verification failed.');
      console.log(
        '⚠️  Check the env file and enter the correct webhook secret.'
      );
      return res.status(400).json();
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    const { customer: customerId } = dataObject;

    let subscription: any;
    let checkoutSessionId: string;
    let subscriptionId: string;

    switch (event.type) {
      case 'checkout.session.completed':
        subscriptionId = dataObject.subscription;
        checkoutSessionId = dataObject.id;
        subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // upsert subscription in DB
        await SubscriptionService.insertSubscription({
          customerId,
          description: subscription.plan.nickname,
          checkoutSessionId,
          stripeSubscriptionId: subscription.id,
          status: 'pending'
        });
        console.log('checkout.session.completed');
        break;

      case 'invoice.paid': {
        // get subscription id
        subscriptionId = dataObject.subscription;

        // retrieve subscription by id
        subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // compute expiration time (by month or year)
        const expirationTime =
          (subscription.plan.interval === 'month' ? 30 : 365) * // 30 days per month or 365 days per year
          24 * // 24h per day
          60 * // 60m per hour
          60 * // 60s per minute
          1000; // 1000ms per second

        // update user's activeSubscription
        await AuthService.updateSubscription({
          customerId,
          subscription: subscription.plan.nickname.toUpperCase(),
          expirationTime
        });

        // update subscription record
        await SubscriptionService.updateStatusSubscription({
          stripeSubscriptionId: subscriptionId,
          status: 'complete'
        });
        console.log('invoice.paid');
        break;
      }

      case 'invoice.payment_failed':
        // get the subscription id
        subscriptionId = dataObject.subscription;

        // update the subscription as failed payment
        await SubscriptionService.updateStatusSubscription({
          stripeSubscriptionId: subscriptionId,
          status: 'incomplete'
        });

        // do nothing after an incomplete payment
        console.log('invoice.payment_failed');
        break;

      case 'customer.subscription.deleted':
        // get the subscription id
        subscriptionId = dataObject.id;

        // catch request cancel subscription
        if (event.request != null) {
          await SubscriptionService.cancelSubscription(subscriptionId);
          console.log('The subscription was canceled!');
        }
        break;

      default:
        throw new ApolloError('Something was wrong, please try again!');
    }
    res.sendStatus(200);
  };
}
