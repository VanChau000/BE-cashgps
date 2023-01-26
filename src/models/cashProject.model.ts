import { ApolloError } from 'apollo-server-express';
import { KnexCashProject } from 'knex/types/tables';
import clients from '../clients';
import {
  ICashProject,
  IProjectIdAndOwnerId,
  IUpsertCashProject
} from '../types/interfaces';
import { formatDate } from '../utils/formatPermissionText';
import { canUserHaveMoreProjects } from '../utils/subscriptionLimit';
import SharingsModel from './sharing.model';
import UserModel from './user.model';

declare module 'knex/types/tables' {
  interface KnexCashProject {
    id: string;
    ownerId: string;
    name: string;
    startingBalance: number;
    timezone: string;
    currency: string;
    initialCashFlow: string;
    startDate: string;
    weekSchedule: number;
  }

  interface Tables {
    cashProjects: KnexCashProject;
  }
}

export function serializeCashProject(
  cashProject: KnexCashProject
): ICashProject {
  return {
    id: cashProject.id,
    name: cashProject.name,
    startingBalance: cashProject.startingBalance,
    currency: cashProject.currency,
    initialCashFlow: cashProject.initialCashFlow,
    ownerId: cashProject.ownerId,
    startDate: cashProject.startDate,
    timezone: cashProject.timezone,
    weekSchedule: cashProject.weekSchedule
  };
}

const knexClient = clients.knex.getInstance();

export class CashProjectModel {
  /**
   * get project by id
   * @param {projectId, ownerId}
   * @returns {project}
   */
  static getProjectById = async ({
    ownerId,
    projectId
  }: IProjectIdAndOwnerId) => {
    try {
      const [project] = (
        await knexClient('cashProjects').where({
          ownerId,
          id: projectId as any
        })
      ).map(serializeCashProject);

      return project;
    } catch (error) {
      return undefined;
    }
  };

  /**
   * upsert project
   * @param {ownerId, projectId}
   * @param {values}
   * @returns
   */
  static createOrUpdateCashProject = async (
    { ownerId, projectId }: IProjectIdAndOwnerId,
    values: IUpsertCashProject
  ) => {
    const project = await this.getProjectById({ ownerId, projectId });

    // update
    if (project) {
      await knexClient('cashProjects').where('id', project.id).update(values);
      return 'Project was updated';
    }

    // insert
    if (await canUserHaveMoreProjects(ownerId)) {
      const startDate: any = new Date(values.startDate as string);

      const initialCashFlow: any = formatDate(
        new Date(startDate - 1 * 24 * 3600 * 1000)
      );

      // get current user
      const currentUser = await UserModel.getUserById(ownerId);

      await knexClient('cashProjects').insert({
        ...values,
        timezone: currentUser.timezone,
        initialCashFlow,
        ownerId
      });
      return 'Project was inserted';
    }
    throw new ApolloError('Upgrade your subscription to perform this action.');
  };

  /**
   * get all projects by ownerId
   * @param ownerId
   * @returns {[project]}
   */
  static listProjects = async (ownerId: string) => {
    const projects = (
      await knexClient('cashProjects')
        .where('ownerId', ownerId)
        .orderBy('initialCashFlow')
    ).map(serializeCashProject);

    return projects;
  };

  /**
   * count how many projects of account
   * @param ownerId @string
   * @returns {number}
   */
  static countProjects = async (ownerId: string) =>
    (await this.listProjects(ownerId)).length;

  /**
   * get projectId of current user
   * @param ownerId
   * @returns {[projectId]}
   */
  static getProjectId = async (ownerId: string) => {
    try {
      const projectIds = (
        await knexClient('cashProjects').where({ ownerId }).select('id')
      ).map((el) => el.id);

      return projectIds;
    } catch (error) {
      return null;
    }
  };

  /**
   * get project by id
   * @param projectId
   * @returns {project}
   */
  static getProject = async (projectId: string) => {
    const [project] = (
      await knexClient('cashProjects').where({ id: projectId })
    ).map(serializeCashProject);

    return project;
  };

  /**
   * get ownerId of the project nby projectId
   * @param projectId
   * @returns {String}
   */
  static getOwnerIdOfProject = async (projectId: string) => {
    const [{ ownerId }] = (
      await knexClient('cashProjects').where({ id: projectId })
    ).map(serializeCashProject);

    return ownerId;
  };

  /**
   * delete project
   * @param projectId
   */
  static deleteProject = async ({
    projectId,
    ownerId
  }: IProjectIdAndOwnerId) => {
    await knexClient('cashProjects')
      .where({ id: projectId as string, ownerId })
      .del();
  };

  /**
   * list the sharing projects
   * @param ownerId
   * @returns {projects[]}
   */
  static listSharingProjects = async (ownerId: string) => {
    // list projects be shared that users can access
    const projectIds = await SharingsModel.listSharingProjectIds(ownerId);

    // get the owner's projects
    const projects = await Promise.all(
      projectIds.map(async (id) => await this.getProject(id as any))
    );

    return projects;
  };
}
