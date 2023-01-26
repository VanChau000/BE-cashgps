import { Application } from 'express';
import authRoutes from './auth.routes';
import healthCheckRoutes from './healthCheck.routes';
import paymentRoutes from './payment.routes';
import sharingRoutes from './sharing.routes';

export default (app: Application) => {
  authRoutes(app);
  healthCheckRoutes(app);
  paymentRoutes(app);
  sharingRoutes(app);
};
