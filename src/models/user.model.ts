import { UserInputError } from 'apollo-server-express';
import { KnexUser } from 'knex/types/tables';
import crypto from 'crypto';
import clients from '../clients';
import {
  IGetUserByEmail,
  IIdAndCode,
  IIdAndEmail,
  IUpdatePasswordUser,
  IUpdateUserInfo,
  IUpdateUserSubscription,
  IUser,
  IUserLoginByGoogle,
  IUserSignupArgs
} from '../types/interfaces';
import { normalPlanForNewbie } from '../constants/cashgpsPlans';

declare module 'knex/types/tables' {
  interface KnexUser {
    id: string;
    googleId: string | null;
    email: string;
    password: string | null;
    firstName: string;
    lastName: string;
    timezone: string;
    currency: string;
    isEmailVerified: boolean;
    customerId: string;
    activeSubscription: string | null;
    subscriptionExpiresAt: Date | null;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
    confirmationCode: string | null;
  }

  interface Tables {
    users: KnexUser;
  }
}

export function serializeUser(user: KnexUser): IUser {
  return {
    id: user.id,
    googleId: user.googleId,
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    timezone: user.timezone,
    currency: user.currency,
    isEmailVerified: user.isEmailVerified,
    activeSubscription: user.activeSubscription,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    passwordResetToken: user.passwordResetToken,
    passwordResetExpires: user.passwordResetExpires,
    confirmationCode: user.confirmationCode,
    customerId: user.customerId
  };
}

const knexClient = clients.knex.getInstance();

export const checkIfUserExistsByEmail = async ({ email }: IGetUserByEmail) => {
  const [result] = await knexClient('users').where('email', email);
  return !!result;
};

export const failedEmailsInvitation = async ({ id, email }: IIdAndEmail) => ({
  id,
  email,
  result: await checkIfUserExistsByEmail({ email })
});

export const isTokenResetPasswordExpired = (time: Date) =>
  !time ? time < new Date() : true;

export default class UserModel {
  /**
   * get User by email
   * @param getUserEmail
   * @returns {Promise<IUser>}
   */
  static getUser = async (getUserEmail: IGetUserByEmail): Promise<IUser> => {
    const checkUserExists = await checkIfUserExistsByEmail({
      email: getUserEmail.email
    });

    if (!checkUserExists) {
      throw new UserInputError(
        `Could not find user with email ${getUserEmail.email}`
      );
    }

    const [user] = (
      await knexClient('users').where('email', getUserEmail.email)
    ).map(serializeUser);

    return user;
  };

  /**
   * get user by id
   * @param id
   * @returns {user}
   */
  static getUserById = async (id: string): Promise<IUser> => {
    const [user] = (await knexClient('users').where({ id })).map(serializeUser);

    return user;
  };

  /**
   * sign up
   * @param userArgs
   * @returns {Promise<number[]>}
   */
  static createUser = async (
    userArgs: IUserSignupArgs | IUserLoginByGoogle
  ) => {
    const { ACTIVE_SUBSCRIPTION, EXPIRATION_TIME } = normalPlanForNewbie;

    if (!userArgs.timezone) userArgs.timezone = 'UTC±00:00';
    if (!userArgs.currency) userArgs.currency = 'USD';

    await knexClient<KnexUser>('users').insert({
      ...userArgs,
      activeSubscription: ACTIVE_SUBSCRIPTION,
      subscriptionExpiresAt: new Date(EXPIRATION_TIME as any)
    });
  };

  /**
   * edit user profile
   * @param userInfoUpdate
   */
  static updateUser = async ({ id, ...updateUserArgs }: IUpdateUserInfo) => {
    await knexClient<KnexUser>('users').where({ id }).update(updateUserArgs);
  };

  /**
   * get reset token -> forgot password
   * @param {email}
   * @returns {resetToken}
   */
  static createPasswordResetToken = async ({ email }: IGetUserByEmail) => {
    try {
      // get current user
      const user = await this.getUser({ email });

      // throw error with account signed with GG
      if (user.googleId)
        throw new UserInputError('You have to login with google this account.');

      // if token has NOT been expired or be null -> generate token and update in users table (DB)
      if (await isTokenResetPasswordExpired(user.passwordResetExpires as any)) {
        const passwordResetToken = crypto.randomBytes(32).toString('hex');

        const PASSWORD_RESET_EXPIRATION = 10 * 60 * 1000;
        const passwordResetExpires = new Date(
          Date.now() + PASSWORD_RESET_EXPIRATION
        );

        await knexClient<KnexUser>('users').where({ email }).update({
          passwordResetExpires,
          passwordResetToken
        });

        return passwordResetToken;
      }

      // if token EXPIRED, throw error -> let user check email and get the reset link
      throw new UserInputError('A reset link has been sent to your email.');
    } catch (error: any) {
      // update fields in users table (DB)
      if (error.message !== 'A reset link has been sent to your email.') {
        await knexClient<KnexUser>('users').where({ email }).update({
          passwordResetExpires: null,
          passwordResetToken: null
        });
      }
      throw error;
    }
  };

  /**
   * get user forgetting password
   * @param token @string
   * @returns {user} @IUser
   */
  static userResetPassword = async (token: string) =>
    await this.checkUserResettingPasswordTokenExpired(token);

  /**
   * check if reseting password token expireid
   * @param token
   * @returns {Promise<KnexUser> null}
   */
  static checkUserResettingPasswordTokenExpired = async (token: string) => {
    const [user] = await knexClient('users')
      .where('passwordResetToken', token)
      .andWhere(function () {
        this.where('passwordResetExpires', '>', new Date());
      });

    return user;
  };

  /**
   * change password
   * @param {password, user}
   */
  static updatePassword = async ({ password, user }: IUpdatePasswordUser) => {
    await knexClient<KnexUser>('users').where({ email: user.email }).update({
      password,
      passwordResetToken: null,
      passwordResetExpires: null
    });
  };

  /**
   * delete user when failed signup
   * @param user
   */
  static deleteUser = async (user: IUser) => {
    await knexClient('users').where({ id: user.id }).del();
  };

  /**
   * create code confirm email
   * @param {id, confirmationCode}
   */
  static createCodeVerifyEmail = async ({
    id,
    confirmationCode
  }: IIdAndCode) => {
    const user = await this.getUserById(id);

    // if non-user
    if (!user) throw new UserInputError('Invalid user ID');

    await this.updateUser({ id, confirmationCode });
  };

  /**
   * verify email
   * @param {id, confirmationCode}
   */
  static verifyEmail = async ({ id, confirmationCode }: IIdAndCode) => {
    const [user] = (
      await knexClient('users').where({ id, confirmationCode })
    ).map(serializeUser);

    if (!user) throw new UserInputError('User not found');

    await this.updateUser({
      id: user.id,
      isEmailVerified: true,
      confirmationCode: null
    });
  };

  /**
   * update user to PREMIUM
   * @param customerId
   * @param expirationTime
   * @param subscription
   */
  static updateUserSubscription = async ({
    customerId,
    expirationTime,
    subscription
  }: IUpdateUserSubscription) => {
    // update ACTIVE_SUBSCRIPTION and extend time
    await knexClient('users')
      .where({ customerId })
      .update({
        activeSubscription: subscription,
        subscriptionExpiresAt: new Date(Date.now() + expirationTime)
      });

    // get current user by customerId
    const [user] = (await knexClient('users').where({ customerId })).map(
      serializeUser
    );

    return user;
  };

  /**
   * get ActiveSubscription By CustomerId
   * @param customerId @string
   * @returns {String}
   */
  static getActiveSubscriptionByCustomerId = async (customerId: string) => {
    const [{ activeSubscription, subscriptionExpiresAt }] = (
      await knexClient('users').where({ customerId })
    ).map(serializeUser);

    if (subscriptionExpiresAt && subscriptionExpiresAt > new Date()) {
      return activeSubscription;
    }

    return null;
  };
}
