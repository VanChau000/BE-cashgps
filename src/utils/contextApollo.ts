import { ApolloError } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import { CashProjectModel } from '../models/cashProject.model';
import SharingsModel from '../models/sharing.model';
import UserModel from '../models/user.model';
import { IUserPayload } from '../types/interfaces';
import { isValidToken } from './jwt';

export const context = async ({ req }: any) => {
  // get token
  const token = req.headers.authorization || '';

  // check valid token
  const isValidJwt = isValidToken(token);

  if (!isValidJwt)
    throw new ApolloError(
      'Valid authorization header not provided (invalid token).'
    );

  // decode token
  const decoded = jwt.decode(token, { complete: true });

  // check null token
  if (decoded === null) {
    throw new ApolloError(
      'Valid authorization header not provided (decoded = null).'
    );
  }

  let user: any;
  let userProjectIds: any;

  if (token !== '') {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as IUserPayload;

    // get infomation of user
    user = await UserModel.getUser({ email: decodedToken.email });
    const { activeSubscription, subscriptionExpiresAt } = user; // user's subscription

    // get all project IDs of current user
    userProjectIds = (await CashProjectModel.getProjectId(user.id))?.toString();

    // if user is newbie, return;
    if (activeSubscription === 'NORMAL' || subscriptionExpiresAt < new Date())
      return {
        headers: req.headers,
        expressRequest: req,
        token,
        userProjectIds: [],
        profile: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          activeSubscription: user.activeSubscription,
          customerId: user.customerId
        },
        authorityWithProjects: []
      };

    // check subscription is valid and expired
    if (
      activeSubscription &&
      subscriptionExpiresAt < new Date() &&
      (activeSubscription === 'TRIAL' ||
        ['STARTER', 'BASIC', 'MEDIUM', 'PREMIUM'].includes(
          activeSubscription.split(' ')[1]
        ))
    )
      throw new ApolloError('Your subscription has not been activated yet!');
  }

  // list all sharing project IDs
  const listSharingProjectIds = await CashProjectModel.listSharingProjects(
    user.id
  );

  // list all project IDs with user's permission
  const authorityWithProjects = await Promise.all(
    listSharingProjectIds.map(async ({ id: projectId }) => ({
      projectId,
      permission: await SharingsModel.getPermissionOfRecord({
        authorizedUserId: user.id,
        projectId
      })
    }))
  );

  return {
    headers: req.headers,
    expressRequest: req,
    token,
    userProjectIds,
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      activeSubscription: user.activeSubscription,
      customerId: user.customerId
    },
    authorityWithProjects
  };
};
