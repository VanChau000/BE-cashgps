import { Application } from 'express';
import AuthController from '../controllers/auth.controller';

export default (app: Application) => {
  // SIGNIN/UP
  app.post('/auth/signup', AuthController.signup);
  app.post('/auth/login', AuthController.login);

  // verify email
  app.get(
    '/auth/signup/confirm/:id/:confirmationCode',
    AuthController.verifyEmail
  );
  // resend url to confirm email
  app.get('/auth/signup/confirm/:id', AuthController.resendEmailConfirm);

  // forgot password
  app.post('/auth/forgot/password', AuthController.forgotPassword);

  // reset password
  app.post('/auth/reset/password/:resetToken', AuthController.resetPassword);

  // GOOGLE AUTH
  app.post('/auth/google/callback', AuthController.loginWithGoogle);
};
