import { ApolloError, UserInputError } from 'apollo-server-express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import UserModel, { checkIfUserExistsByEmail } from '../models/user.model';
import {
  IGetUserByEmail,
  IIdAndCode,
  IUpdateUserSubscription,
  ILoginUserArgs,
  IResetPassword,
  IUpdatePasswordUser,
  IUpdateUserInfo,
  IUser,
  IUserLoginByGoogle,
  IUserPayload,
  IUserSignupArgs
} from '../types/interfaces';
import sendEmail from '../utils/nodemailer';
import {
  validateEmailInput,
  validateFirstNameInput,
  validateLastNameInput,
  validatePasswordInput
} from '../utils/validation';
import { createCustomerStripe } from '../utils/stripe';
import { CashProjectModel } from '../models/cashProject.model';
import { trialPlan } from '../constants/cashgpsPlans';

const generateAccessToken = ({ userId, email }: IUserPayload) => {
  const accessToken = jwt.sign(
    {
      userId,
      email
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );
  return accessToken;
};

const generateHashedPassword = async (passwordUserInput: string) => {
  const hashedPassword = await bcrypt.hash(passwordUserInput, 10);
  return hashedPassword;
};

const comparePassword = async (
  passwordUserInput: string,
  hashedPassword: string
) => {
  const result = await bcrypt.compare(passwordUserInput, hashedPassword);
  return result;
};

export default class AuthService {
  /**
   * create code to confirm
   * @param id
   * @returns {url to confirm}
   */
  static createUrlConfirmationEmail = async (id: string) => {
    const code = crypto.randomBytes(32).toString('hex');
    await UserModel.createCodeVerifyEmail({ id, confirmationCode: code });
    const url = `${process.env.SERVER_URL}/auth/signup/confirm/${id}/${code}`;
    return url;
  };

  /**
   * send welcome email
   * @param {IUser} user
   * @param {string} confirmUrl
   */
  static sendWelcomeEmail = async (user: any, confirmUrl: string) => {
    await sendEmail(
      user.email,
      `Welcome ${user.firstName} to CashGPS`,
      `<h3>We're glad to have you 🎉</h3>
      <p>Please click the link below to verify your account:</p>
      <a href="${confirmUrl}">Click here!</a>`
    );
  };

  /**
   * get current user
   * @param getEmailUser
   * @returns {Promise<IUser>}
   */
  static getUser = async (getEmailUser: IGetUserByEmail): Promise<IUser> => {
    const user = await UserModel.getUser(getEmailUser);
    return user;
  };

  /**
   * register
   * @param userSignupArgs
   * @returns {Promise<id, email, fullname, googleId>}
   */
  static signup = async (userSignupArgs: IUserSignupArgs): Promise<unknown> => {
    // check user exists
    if (await checkIfUserExistsByEmail({ email: userSignupArgs.email }))
      throw new UserInputError('Email already exists');

    // validate fields
    const validateEmail = validateEmailInput(userSignupArgs.email);
    if (validateEmail) throw new UserInputError('Please enter a valid email.');

    // validate password
    if (userSignupArgs.password !== null) {
      const validatePassword = validatePasswordInput(userSignupArgs.password);
      if (validatePassword)
        throw new UserInputError(
          'At least 8 chars password with letters and numbers'
        );
    }

    // validate first name
    const validateFirstname = validateFirstNameInput(userSignupArgs.firstName);
    if (validateFirstname)
      throw new UserInputError(
        'First name must contain at least 3 characters.'
      );

    // validate last name
    const validateLastname = validateLastNameInput(userSignupArgs.lastName);
    if (validateLastname)
      throw new UserInputError('Last name must contain at least 3 characters.');

    // hash password
    const passwordUserInput = userSignupArgs.password;
    if (passwordUserInput !== null) {
      userSignupArgs.password = await generateHashedPassword(
        passwordUserInput as string
      );
    }

    // new customer user
    const customer = await createCustomerStripe({
      email: userSignupArgs.email,
      firstName: userSignupArgs.firstName,
      lastName: userSignupArgs.lastName
    });

    await UserModel.createUser({ ...userSignupArgs, customerId: customer.id });

    const user = await UserModel.getUser({ email: userSignupArgs.email });

    // send email
    try {
      // create confirm url to verify
      const confirmUrl = await this.createUrlConfirmationEmail(user.id);

      // send confirm email
      await this.sendWelcomeEmail(user, confirmUrl);
    } catch (error) {
      // if can't send email, remove that user and notify the error
      await UserModel.deleteUser(user);

      throw new Error('Something was wrong, try again!');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      googleId: user.googleId,
      timezone: user.timezone,
      currency: user.currency
    };
  };

  /**
   * login
   * @param loginArgs
   * @returns {accessToken, refreshToken, userId}
   */
  static login = async (loginArgs: ILoginUserArgs) => {
    // validate email
    const validateEmail = validateEmailInput(loginArgs.email);
    if (validateEmail) throw new UserInputError('Invalid email');

    const user = await UserModel.getUser({ email: loginArgs.email });

    if (!user) {
      throw new UserInputError('Wrong email or password');
    }

    // check if user has a project
    const projectIds = await CashProjectModel.getProjectId(user.id);

    // check correct password
    const isCorrectPassword = await comparePassword(
      loginArgs.password,
      user.password as string
    );

    if (!isCorrectPassword) throw new UserInputError('Wrong email or password');

    if (!user.isEmailVerified) {
      await this.sendUrlConfirmEmail(user.id);
      throw new UserInputError('Not verified');
    }

    // generate payload
    const payload: IUserPayload = {
      userId: user.id,
      email: user.email
    };

    // generate token
    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
      profile: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        currency: user.currency,
        activeSubscription: user.activeSubscription,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        isEmailVerified: user.isEmailVerified,
        hasProject: !!projectIds?.length,
        projectIds
      }
    };
  };

  /**
   * login with google
   * @param {email, firstName,googleId,lastName}
   * @returns {id, email, googleId, firstName, lastName}
   */
  static loginWithGoogle = async ({
    email,
    firstName,
    googleId,
    lastName,
    timezone,
    currency
  }: IUserLoginByGoogle) => {
    // check user has been existed
    const checkUserExists = await checkIfUserExistsByEmail({
      email
    });

    let user: IUser;

    // if user is a new account -> create user with GG
    if (!checkUserExists) {
      // create new stripe customer
      const customer = await createCustomerStripe({
        email,
        firstName,
        lastName
      });

      // create new account and store in DB
      await UserModel.createUser({
        email,
        firstName,
        googleId,
        lastName,
        timezone,
        currency,
        customerId: customer.id
      });

      // get the new user
      user = await UserModel.getUser({ email });

      try {
        // create confirm url to verify
        const confirmUrl = await this.createUrlConfirmationEmail(user.id);

        // send confirm email
        await this.sendWelcomeEmail(user, confirmUrl);
      } catch (error) {
        // if can't send email, remove that user and notify the error
        await UserModel.deleteUser(user);

        throw new Error('Something was wrong, try again!');
      }
    } else {
      // login to the account has been register by GG
      user = await UserModel.getUser({ email });
      if (user && user.googleId === null)
        throw new UserInputError('Registered account');
    }

    // check if user has a project
    const projectIds = await CashProjectModel.getProjectId(user.id);

    // generate payload
    const payload: IUserPayload = {
      userId: user.id,
      email: user.email
    };

    // generate token
    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
      profile: {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        currency: user.currency,
        activeSubscription: user.activeSubscription,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        isEmailVerified: user.isEmailVerified,
        hasProject: !!projectIds?.length,
        projectIds
      }
    };
  };

  /**
   * forgot password -> send a link to reset password
   * @param {email}
   * @returns {resetUrl}
   */
  static forgotPassword = async ({ email }: IGetUserByEmail) => {
    // validate email
    const validateEmail = validateEmailInput(email);
    if (validateEmail) throw new UserInputError('Please enter a valid email.');

    const user = await UserModel.getUser({ email });

    // throw new error when the account has been register by GG
    // -> user must login with GG
    if (user.googleId)
      throw new UserInputError('You have to login with google this account.');

    // generate token and save token field in users_table (in DB)
    const resetToken = await UserModel.createPasswordResetToken({ email });

    // generate link to access the reset password page
    const resetUrl = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;

    // send email with the reset link
    await sendEmail(
      email,
      'Forgot password',
      `
      <h4>We create a password reset link that will be expired in 10 minutes.</h4>
      <h4>Click the link below to set your new password:<h4>
      <a href="${resetUrl}">Click here</a>
      `
    );

    return {
      message: 'Check your email or spam to get the new password!'
    };
  };

  /**
   * reset password and create new password
   * @param {Token, newPassword}
   * @returns @String
   */
  static resetPassword = async ({ token, password }: IResetPassword) => {
    // check the reset token existed with the current account in DB
    const user = await UserModel.userResetPassword(token);
    if (!user)
      throw new UserInputError(
        'This link was expired, login or forget password again.'
      );

    // validate password input field
    const validatePassword = validatePasswordInput(password);
    if (validatePassword)
      throw new UserInputError(
        'At least 8 characters with letters and numbers'
      );

    // hash password
    const hashedPassword = await generateHashedPassword(password);

    // update password
    await UserModel.updatePassword({ user, password: hashedPassword });

    return 'Password changed successfully!';
  };

  /**
   * check if link resetting password is expired
   * @param token
   * @returns @boolean
   */
  static isLinkResettingPasswordExpired = async (token: string) =>
    !!(await UserModel.userResetPassword(token));

  /**
   * send link to confirm email
   * @param id
   */
  static sendUrlConfirmEmail = async (id: string) => {
    // get current info user
    const user = await UserModel.getUserById(id);
    if (!user) throw new ApolloError('Not found');

    // if user has been verified
    if (user.isEmailVerified)
      throw new UserInputError('Account was verified! Please log in.');

    // send email
    const confirmUrl = await this.createUrlConfirmationEmail(user.id);
    await sendEmail(
      user.email,
      `Welcome ${user.firstName} to CashGPS`,
      `<h3>We're glad to have you 🎉</h3>
        <p>Please click the link below to verify your account:</p>
        <a href="${confirmUrl}">Click here!</a>`
    );
  };

  /**
   * verify email
   * @param {id, confirmationCode}
   */
  static verifyEmail = async ({ id, confirmationCode }: IIdAndCode) => {
    // get the info of current user
    const user = await UserModel.getUserById(id);

    // verified successfully
    if (user.isEmailVerified)
      throw new UserInputError('Account was verified! Please log in.');

    await UserModel.verifyEmail({ id, confirmationCode });
  };

  /**
   * update user's profile
   * @param {IUpdateUserInfo}
   * @returns {user}
   */
  static updateUserProfile = async ({
    id,
    firstName,
    lastName,
    currency,
    timezone
  }: IUpdateUserInfo) => {
    // update user
    await UserModel.updateUser({ id, firstName, lastName, timezone, currency });

    // get current user
    const user = await UserModel.getUserById(id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      currency: user.currency,
      timezone: user.timezone,
      activeSubscription: user.activeSubscription,
      subscriptionExpiresAt: user.subscriptionExpiresAt
    };
  };

  /**
   * start free trial plan
   * @param ownerId
   */
  static startFreeTrialPlan = async (ownerId: string) => {
    const { activeSubscription } = await UserModel.getUserById(ownerId);

    const { ACTIVE_SUBSCRIPTION, EXPIRATION_TIME } = trialPlan;

    if (activeSubscription === 'NORMAL') {
      await UserModel.updateUser({
        id: ownerId,
        activeSubscription: ACTIVE_SUBSCRIPTION,
        subscriptionExpiresAt: new Date(EXPIRATION_TIME)
      });
      return 'Your free trial started!';
    }

    return 'You cannot start the trail plan!';
  };

  /**
   * update subscription
   * @param {IUpdateUserSubscription}
   * @returns {user}
   */
  static updateSubscription = async ({
    customerId,
    subscription,
    expirationTime
  }: IUpdateUserSubscription) => {
    // update subscription & return the alternative user
    const user = await UserModel.updateUserSubscription({
      customerId,
      expirationTime,
      subscription
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      activeSubscription: user.activeSubscription,
      subscriptionExpiresAt: user.subscriptionExpiresAt
    };
  };

  /**
   * change Password
   * @param IUpdatePasswordUser
   */
  static changePassword = async ({
    password,
    user,
    currentPassword
  }: IUpdatePasswordUser) => {
    // validate password input field
    const validatePassword = validatePasswordInput(password);

    // get the current hashed password
    const currentHashedPassword = (
      await UserModel.getUser({ email: user.email })
    ).password;

    // check if matched
    const isCorrectPassword = await comparePassword(
      currentPassword as string,
      currentHashedPassword as string
    );

    // throw when password is incorrect
    if (!isCorrectPassword)
      throw new UserInputError("You've entered wrong password.");

    // throw error, the password does not meet the criteria
    if (validatePassword)
      throw new UserInputError(
        'At least 8 characters with letters and numbers'
      );

    // generate new hashed password (as valid password)
    if (password !== null) {
      password = await generateHashedPassword(password);
    }

    // store new password into DB
    await UserModel.updatePassword({ password, user });
  };

  /**
   * getActiveSubscriptionByCustomerId
   * @param customerId @string
   * @returns {String}
   */
  static getActiveSubscriptionByCustomerId = async (customerId: string) =>
    await UserModel.getActiveSubscriptionByCustomerId(customerId);
}
