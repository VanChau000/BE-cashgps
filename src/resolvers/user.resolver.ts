import { UserInputError } from 'apollo-server-express';
import AuthService from '../services/auth.service';
import CashProjectService from '../services/cashProject.service';
import {
  IContext,
  IUpdatePasswordArgs,
  IUpdateUserInfo
} from '../types/interfaces';
import { formatDate } from '../utils/formatPermissionText';
import {
  validateFirstNameInput,
  validateLastNameInput
} from '../utils/validation';

const userResolvers = {
  /**
   * get current user
   * @param {undefined} _
   * @param {IGetUserByEmail} {email}
   * @returns {Promise<any>}
   */
  getUser: async (
    _: undefined,
    __: undefined,
    context: IContext
  ): Promise<any> => {
    // current user
    const user = await AuthService.getUser({ email: context.profile.email });

    // check if user owns the project or not
    const hasProject = !!(await CashProjectService.listProjects(user.id))
      .projects.length;

    // get the expiration time of user
    const { subscriptionExpiresAt } = user;

    return {
      user: {
        ...user,
        subscriptionExpiresAt: formatDate(subscriptionExpiresAt as any)
      },
      hasProject
    };
  },

  /**
   * start free trial plan
   * @param _
   * @param __
   * @param context @IContext
   * @returns {string}
   */
  startFreeTrialPlan: async (_: undefined, __: undefined, context: IContext) =>
    await AuthService.startFreeTrialPlan(context.profile.id),

  /**
   * update user
   * @param _
   * @param {firstName, lastName}
   * @param context
   * @returns {modifiedUser}
   */
  updateUser: async (
    _: undefined,
    { firstName, lastName, currency, timezone }: IUpdateUserInfo,
    context: IContext
  ) => {
    // check firstname & lastname are not empty
    if (firstName === '' || lastName === '')
      throw new UserInputError('Cannot be left empty in the input field.');

    // validate first name
    if (firstName) {
      firstName = firstName.trim();
      const validateFirstname = validateFirstNameInput(firstName as string);
      if (validateFirstname)
        throw new UserInputError(
          'First name must contain at least 3 characters.'
        );
    }

    // validate last name
    if (lastName) {
      lastName = lastName.trim();
      const validateLastname = validateLastNameInput(lastName as string);
      if (validateLastname)
        throw new UserInputError(
          'Last name must contain at least 3 characters.'
        );
    }

    // get the user after change
    const alternativeUser = await AuthService.updateUserProfile({
      id: context.profile.id,
      firstName,
      lastName,
      timezone,
      currency
    });

    return alternativeUser;
  },

  /**
   * change user password
   * @param _
   * @param args
   * @param context
   */
  changePassword: async (
    _: undefined,
    args: {
      updatePasswordArgs: IUpdatePasswordArgs;
    },
    context: IContext
  ) => {
    const { currentPassword, newPassword, newPasswordConfirm } =
      args.updatePasswordArgs;

    // if matched 2 passwords, change password
    if (newPassword === newPasswordConfirm)
      await AuthService.changePassword({
        password: newPassword,
        user: context.profile as any,
        currentPassword
      });
    else throw new UserInputError('Two passwords do not match.');

    return { message: 'Change password successfully' };
  },

  /**
   * check if link reset password is expired
   * @param _
   * @param {token}
   * @returns {boolean}
   */
  isLinkResetPasswordExpired: async (_: undefined, args: { token: string }) =>
    await AuthService.isLinkResettingPasswordExpired(args.token)
};

export default userResolvers;
