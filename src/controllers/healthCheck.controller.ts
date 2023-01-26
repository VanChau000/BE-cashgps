import { Request, Response } from 'express';
import clients from '../clients';

export class HealthCheck {
  static healthCheck = async (req: Request, res: Response) => {
    const data = {
      uptime: process.uptime(),
      message: 'OK',
      date: new Date()
    };
    try {
      clients.knex.getInstance();
      res.status(200).send(data);
    } catch (error) {
      res.status(503).send();
    }
  };
}
