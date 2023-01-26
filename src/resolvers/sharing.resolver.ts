import { ApolloError } from 'apollo-server-express';
import { ActiveSubscription } from '../constants/enumType';
import { plans } from '../constants/limitPlan';
import SharingService from '../services/sharing.service';
import {
  IContext,
  IInvitation,
  ISharings,
  IUserIdAndProjectId
} from '../types/interfaces';
import {
  canOwnerShareMore,
  canUserShareProjects
} from '../utils/subscriptionLimit';

const sharingResolvers = {
  invite: async (
    _: undefined,
    args: { invitationArgs: IInvitation },
    context: IContext
  ) => {
    const { id: ownerId, activeSubscription } = context.profile;
    const { projectId } = args.invitationArgs;
    if (
      !(
        (await canUserShareProjects(ownerId)) ||
        (await canOwnerShareMore(ownerId, projectId))
      )
    ) {
      throw new ApolloError(
        'Upgrade your subscription to perform this action.'
      );
    }

    if (!context.userProjectIds.length)
      throw new ApolloError('You have not any project');

    const { permission, emails } = args.invitationArgs;

    try {
      emails.forEach(({ email }) => {
        if (email === context.profile.email)
          throw new ApolloError('You can not send to yourself');
      });
    } catch (error) {
      return [];
    }

    // check if user send to error emails (not exist, wrong email...)
    const failedEmails = await SharingService.doEmailsExist(emails);

    // check number of users be shared (by owner's active subscription)
    const formatSubscriptionText = (activeSubscription.split(' ')[1] ||
      activeSubscription) as ActiveSubscription;
    if (
      !(await SharingService.checkLimitUsersBeSharedWhenSubscriptionOwner(
        projectId,
        emails,
        formatSubscriptionText
      ))
    ) {
      throw new ApolloError(
        `You only share with ${plans[formatSubscriptionText].usersBeSharedCount} people!`
      );
    }

    // if no one invalid, save in DB and send invitation via email
    if (!failedEmails.length) {
      if (permission === 'VIEW' || 'EDIT') {
        emails.forEach(async ({ email }) => {
          await SharingService.createRecord({
            email,
            projectId
          });
        });
      } else {
        return '';
      }

      // send email to allow users access the project
      emails.map(async ({ email }) => {
        await SharingService.invite({
          ownerId,
          projectId,
          recipient: email,
          permission
        });
      });

      // return an empty array as no error mails
      return [];
    }

    // return the list of failed emails
    return failedEmails;
  },

  listInfoOfAuthorizedUsersWithProject: async (
    _: undefined,
    args: { projectId: string }
  ) => {
    const infoOfAuthorizedUsers =
      await SharingService.listInfoOfAuthorizedUsersWithProject(args.projectId);
    return infoOfAuthorizedUsers;
  },

  updatePermission: async (_: undefined, args: { sharingArgs: ISharings }) => {
    const { permission, projectId, userId } = args.sharingArgs;

    // change permission of user with project (EDIT | VIEW | PENDING)
    await SharingService.updatePermission({ projectId, permission, userId });

    // message of alternative action
    return { result: 'Change permission successfully!' };
  },

  deleteRecord: async (
    _: undefined,
    args: { userIdAndProjectId: IUserIdAndProjectId }
  ) => {
    const { authorizedUserId, projectId } = args.userIdAndProjectId;

    // delete the permission of user with project
    await SharingService.deleteRecord({ authorizedUserId, projectId });

    // message of alternative action
    return { messageOfDeletion: 'Removed account from project successfully!' };
  }
};

export default sharingResolvers;
