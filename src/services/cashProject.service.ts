import { ApolloError } from 'apollo-server-express';
import axios from 'axios';
import { CashProjectModel } from '../models/cashProject.model';
import SharingsModel from '../models/sharing.model';
import UserModel from '../models/user.model';
import {
  IIdAndUpsertCashProject,
  IProjectIdAndOwnerId
} from '../types/interfaces';
import {
  formatDate,
  formatPermissionText
} from '../utils/formatPermissionText';
import CashTransactionService from './cashTransaction.service';

export default class CashProjectService {
  /**
   * upsert project
   * @param {ownerId, projectId}
   * @param {values}
   * @returns
   */
  static createOrUpdateCashProject = async (
    { ownerId, projectId }: IProjectIdAndOwnerId,
    values: IIdAndUpsertCashProject
  ) => {
    if (values.saturdayOrSunday) {
      let weekSchedule = 31;
      weekSchedule += values.saturdayOrSunday[0] === true ? 32 : 0;
      weekSchedule += values.saturdayOrSunday[1] === true ? 64 : 0;
      values.upsertArgs = { ...values.upsertArgs, weekSchedule };
    }

    // update currency
    if (projectId)
      try {
        const currency = values?.upsertArgs?.currency;
        const currentProject = await this.getProjectById({
          ownerId,
          projectId
        });
        if (currency) {
          const currentUnit = currentProject?.currency;
          // get the exchange rate between 2 currencies
          const { rates } = (
            await axios.get(process.env.EXCHANGE_RATES_API as string)
          ).data;
          const rate = rates[currency] / (currentUnit ? rates[currentUnit] : 1);

          // update values of transactions
          await CashTransactionService.convertCurrency({
            ownerId,
            projectId: projectId as string,
            rate
          });

          // update starting balance of project
          await CashProjectModel.createOrUpdateCashProject(
            { ownerId, projectId },
            {
              startingBalance:
                (currentProject?.startingBalance as number) * rate
            }
          );
        }
      } catch (error) {
        throw new ApolloError('Something was wrong, please update later.');
      }

    // the result of action upsert project
    const result = await CashProjectModel.createOrUpdateCashProject(
      {
        ownerId,
        projectId
      },
      { ...values.upsertArgs, name: values.upsertArgs?.name?.trim() }
    );
    return result;
  };

  /**
   * list all projects
   * @param ownerId
   * @returns {IProject[]}
   */
  static listProjects = async (ownerId: string) => {
    // list all projects of owner
    const projects = await CashProjectModel.listProjects(ownerId);

    // get the infomation of owner
    const owner = await UserModel.getUserById(ownerId);

    const detailedProjects = await Promise.all(
      projects.map(async (project) => {
        // get all the permitted records (users were allowed to access the project)
        const records = await SharingsModel.listRecordsByProjectId(project.id);

        return {
          ownerEmail: owner.email,
          ownerLastName: owner.lastName,
          ownerFirstName: owner.firstName,
          ...project,
          sharedWith: await Promise.all(
            records.map(async ({ userId, permission }) => {
              // get the infomation of users be shared
              const user = await UserModel.getUserById(userId);

              return user
                ? {
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    // format permitted text (Can Edit, Can View)
                    permission: formatPermissionText(permission)
                  }
                : {
                    userId: undefined,
                    firstName: undefined,
                    lastName: undefined,
                    email: undefined,
                    permission: undefined
                  };
            })
          )
        };
      })
    );

    // list the sharing projects (the projects that owner has permission)
    const sharingProjects = await CashProjectModel.listSharingProjects(ownerId);

    const sharingProjectsWithPermission = await Promise.all(
      sharingProjects.map(async (project) => {
        // get the infomation of owner per project
        const sharingOwner = await UserModel.getUserById(project.ownerId);

        return {
          ownerEmail: sharingOwner.email,
          ownerLastName: sharingOwner.lastName,
          ownerFirstName: sharingOwner.firstName,
          ...project,
          // get the permission of single project
          permission: await SharingsModel.getPermissionOfRecord({
            authorizedUserId: ownerId,
            projectId: project.id
          })
        };
      })
    );

    // check subscription and its expiration time of owner
    const {
      activeSubscription: ownerActiveSubscription,
      subscriptionExpiresAt
    } = await UserModel.getUserById(ownerId);

    return {
      ownerActiveSubscription,
      ownerSubscriptionExpiresAt: formatDate(subscriptionExpiresAt as any),
      projects: detailedProjects,
      // the projects be shared (except the PENDING sharing projects)
      sharingProjects: sharingProjectsWithPermission
        .map((el) => ({
          ...(el.permission !== 'PENDING'
            ? { ...el, permission: formatPermissionText(el.permission) }
            : {})
        }))
        .filter((el) => el.id)
    };
  };

  /**
   * get project info by id
   * @param IProjectIdAndOwnerId
   * @returns {ICashProject}
   */
  static getProjectById = async ({
    ownerId,
    projectId
  }: IProjectIdAndOwnerId) => {
    // get the project by ID
    const project = await CashProjectModel.getProjectById({
      ownerId,
      projectId
    });

    return project;
  };

  /**
   * get ownerId of the project nby projectId
   * @param projectId
   * @returns {String}
   */
  static getOwnerIdOfProject = async (projectId: string) =>
    await CashProjectModel.getOwnerIdOfProject(projectId);

  /**
   * delete project by id and ownerId
   * @param {ownerId, projectId}
   * @returns {string}
   */
  static deleteProject = async ({
    ownerId,
    projectId
  }: IProjectIdAndOwnerId) => {
    try {
      // remove project
      await CashProjectModel.deleteProject({ ownerId, projectId });

      return 'Cash project has been removed!';
    } catch (error: any) {
      // return the error message
      return error.message;
    }
  };
}
