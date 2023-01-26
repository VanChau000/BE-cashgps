import { ApolloError } from 'apollo-server-express';
import { CashProjectModel } from '../models/cashProject.model';
import SharingsModel from '../models/sharing.model';
import UserModel, { failedEmailsInvitation } from '../models/user.model';
import {
  IEmailAndProjectId,
  IIdAndEmail,
  ISendInvitation,
  ISharings,
  IUserIdAndProjectId
} from '../types/interfaces';
import sendEmail from '../utils/nodemailer';
import { formatPermissionText } from '../utils/formatPermissionText';
import { plans } from '../constants/limitPlan';
import { ActiveSubscription } from '../constants/enumType';

export default class SharingService {
  /**
   * invite user to view the project
   * @param ISendInvitation
   */
  static invite = async ({
    ownerId,
    projectId,
    recipient,
    permission
  }: ISendInvitation) => {
    try {
      // get info's sender
      const sender = await UserModel.getUserById(ownerId);

      // get info's receiver
      const receiver = await UserModel.getUser({
        email: recipient
      });

      // send email to invite user access the project
      await sendEmail(
        recipient,
        `Invitation from ${`${sender.firstName} ${sender.lastName}`} in CashGPS 💲`,
        `<div>
          Hello ${receiver.firstName},
          <div>You have an invitation that you can ${permission} the project of <b>${sender.firstName}</b> (${sender.email}) 👇🏻</div>
          <div>Please let us know if you want to accept the privileges by clicking the <span style="color: green;">Approve</span> link or vice versa with the <span style="color: red;">Decline</span> one.</div>
          <div>
          <a style="color: green; size: 14px; margin: 4px" href="${process.env.SERVER_URL}/sharing/${permission}/${ownerId}/${projectId}/${receiver.id}/approve">Approve</a>
          </div>
          <div>
          <a style="color: rgb(159, 0, 0); size: 14px; margin: 4px" href="${process.env.SERVER_URL}/sharing/${permission}/${ownerId}/${projectId}/${receiver.id}/decline">Decline</a>
          </div>
          <div style="margin-top: 20px"><i>Thanks for your choice!</i></div>
          <div>`
      );

      return `The appeal has been sent to the ${recipient}'s email`;
    } catch (error) {
      return 'Something was wrong!';
    }
  };

  /**
   * check the email shared already exist, return the list of failed email
   * @param emails
   * @returns {string[]}
   */
  static doEmailsExist = async (emails: IIdAndEmail[]) => {
    // get all the objects containing failed email
    const failedEmails = await Promise.all(
      emails.map(
        async ({ id, email }) => await failedEmailsInvitation({ id, email })
      )
    ).then((res) => res);

    return failedEmails.filter((el) => !el.result);
  };

  /**
   * check the limitation of project be shared by owner's active subscription
   * @param projectId
   * @param emails
   * @param activeSubscription
   * @returns {Boolean}
   */
  static checkLimitUsersBeSharedWhenSubscriptionOwner = async (
    projectId: string,
    emails: IIdAndEmail[],
    activeSubscription: ActiveSubscription
  ) => {
    // the limitation of users that can be shared per project
    const { usersBeSharedCount } = plans[activeSubscription];

    // get the current number of user
    const currentRecordsCount = (
      await SharingsModel.listRecordsByProjectId(projectId)
    ).length;

    return typeof usersBeSharedCount === 'string'
      ? true
      : emails.length + currentRecordsCount <= usersBeSharedCount;
  };

  /**
   * store authorization if user approve the invitation
   * @param IEmailAndProjectId
   */
  static createRecord = async ({ email, projectId }: IEmailAndProjectId) => {
    const receiver = await UserModel.getUser({ email });
    await SharingsModel.createRecord({
      authorizedUserId: receiver.id,
      projectId
    });
  };

  /**
   * update permission of record
   * @param ISharings
   * @returns {string}
   */
  static updatePermission = async ({
    projectId,
    permission,
    userId
  }: ISharings) => {
    await SharingsModel.updatePermission({ projectId, permission, userId });

    return 'Your choice was accepted!';
  };

  /**
   * count number of records
   * @param userIdAndProjectId
   * @returns {number}
   */
  static ifUserHasPermission = async (
    userIdAndProjectId: IUserIdAndProjectId
  ) => !!(await SharingsModel.usersCanAccessProjectCount(userIdAndProjectId));

  /**
   * get status of record
   * @param userIdAndProjectId
   * @returns {string}
   */
  static getPermissionOfRecord = async (
    userIdAndProjectId: IUserIdAndProjectId
  ) => await SharingsModel.getPermissionOfRecord(userIdAndProjectId);

  /**
   * revoke authorization
   * @param IUserIdAndProjectId
   */
  static deleteRecord = async ({
    authorizedUserId,
    projectId
  }: IUserIdAndProjectId) => {
    await SharingsModel.deleteRecord({ authorizedUserId, projectId });
  };

  /**
   * listInfoOfAuthorizedUsersWithProject
   * @param projectId @string
   * @returns { id, lastName, firstName, email, permission }
   */
  static listInfoOfAuthorizedUsersWithProject = async (projectId: string) => {
    // get the userId with its permission in project
    const userIds = await SharingsModel.listRecordsByProjectId(projectId);

    // get infomation of users that have access to project
    const infoOfAuthorizedUsers = await Promise.all(
      userIds.map(async ({ userId, permission }) => ({
        ...(await UserModel.getUserById(userId)),
        permission
      }))
    );

    // get the project's ownerId
    const ownerId = await CashProjectModel.getOwnerIdOfProject(projectId);

    // get infomation of project's owner
    const owner = await UserModel.getUserById(ownerId);

    return [
      [
        {
          userId: owner.id,
          lastName: owner.lastName,
          firstName: owner.firstName,
          email: owner.email,
          permission: 'Owner'
        }
      ],
      // get some infomation of permitted users
      infoOfAuthorizedUsers.map(
        ({ id, lastName, firstName, email, permission }) => ({
          userId: id,
          lastName,
          firstName,
          email,
          // format permission text (Can view, Can edit)
          permission: formatPermissionText(permission)
        })
      )
    ];
  };
}
