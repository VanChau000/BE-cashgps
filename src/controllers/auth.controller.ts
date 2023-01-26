import { Request, Response } from 'express';
import axios from 'axios';
import AuthService from '../services/auth.service';
import {
  ILoginUserArgs,
  IUserLoginByGoogle,
  IUserSignupArgs
} from '../types/interfaces';

export default class AuthController {
  static signup = async (req: Request, res: Response) => {
    try {
      // get infomation of new user
      const {
        email,
        lastName,
        firstName,
        password,
        timezone,
        currency,
        token
      }: IUserSignupArgs = req.body;

      // check robot (recapcha)
      await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPCHA_SECRET_KEY}&response=${token}`
      );

      // if check robot: PASS -> implement signup
      if (res.status(200)) {
        // create new account
        const signupResult: any = await AuthService.signup({
          email,
          lastName,
          firstName,
          password,
          timezone,
          currency
        });

        // return infomation of new user
        return res.status(200).json({ signupResult });
      }

      // else check robot: ERROR -> throw error
      throw new Error('Error recapcha');
    } catch (error: any) {
      res.status(400).json({ error });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password }: ILoginUserArgs = req.body;

      const loginResult = await AuthService.login({ email, password });

      res.status(200).json({ loginResult });
    } catch (error: any) {
      if (error.message === 'Not verified')
        return res.status(400).json({
          error: 'Please check the latest email to verify your account!'
        });

      res
        .status(400)
        .json({ error: 'You have entered wrong email or password.' });
    }
  };

  static loginWithGoogle = async (req: Request, res: Response) => {
    try {
      const { googleId, email, firstName, lastName } = req.body;

      const userLoginByGoogle: IUserLoginByGoogle = {
        googleId,
        email,
        firstName,
        lastName
      };

      const userLoginGoogle = await AuthService.loginWithGoogle(
        userLoginByGoogle
      );

      res.status(200).json({ userLoginGoogle });
    } catch (error: any) {
      return res.status(400).json({
        error:
          error.message === 'Registered account'
            ? 'You need to login or forgot the registered account'
            : error
      });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const forgotPassword = await AuthService.forgotPassword({ email });

      res.status(200).json({ forgotPassword });
    } catch (error: any) {
      if (error.message.includes('Could not find user with email'))
        error.message = "This email hasn't been registered.";

      res.status(400).json({ error });
    }
  };

  static resetPassword = async (req: Request, res: Response) => {
    try {
      const { resetToken } = req.params;
      const { password } = req.body;

      const resetPassword = await AuthService.resetPassword({
        token: resetToken,
        password
      } as any);

      res.status(200).json({ resetPassword });
    } catch (error: any) {
      //   return error.message ===
      //     'This link was expired, login or forget password again.'
      //     ? res.redirect(`${process.env.CLIENT_URL}/404/not-found`)
      res.status(400).json({ error });
    }
  };

  static resendEmailConfirm = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await AuthService.sendUrlConfirmEmail(id);

      res.status(200).json({
        message: 'Check the confirmation link in your email again!'
      });
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/404/not-found`);
    }
  };

  static verifyEmail = async (req: Request, res: Response) => {
    try {
      const { id, confirmationCode } = req.params;

      await AuthService.verifyEmail({ id, confirmationCode });

      res.redirect(`${process.env.CLIENT_URL}/success`);
    } catch (error: any) {
      res.redirect(`${process.env.CLIENT_URL}/404/not-found`);
    }
  };
}
