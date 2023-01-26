import { Application } from 'express';
import { HealthCheck } from '../controllers/healthCheck.controller';

export default (app: Application) => {
  app.get('/health', HealthCheck.healthCheck);
};
