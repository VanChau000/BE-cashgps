import { Application } from 'express';
import SharingController from '../controllers/sharing.controller';

export default (app: Application) => {
  // share project
  app.get(
    '/sharing/:permission/:ownerId/:projectId/:receiverId/:choice',
    SharingController.invitation
  );
};
