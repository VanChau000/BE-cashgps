import { Application } from 'express';
import PaymentController from '../controllers/payment.controller';

export default (app: Application) => {
  app.post('/historyPayment', PaymentController.historyPayment);
  app.get('/checkout-session', PaymentController.checkoutSession);
  app.get('/stripe-config', PaymentController.stripeConfig);
  app.get('/checkout-session', PaymentController.checkoutSession);
  app.post('/create-checkout-session', PaymentController.createCheckoutSession);
  app.post('/customer-portal', PaymentController.customerPortal);
  app.post('/webhooks', PaymentController.webhooks);
};
