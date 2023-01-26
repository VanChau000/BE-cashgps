import { KnexSharings } from 'knex/types/tables';
import clients from '../clients';
import { Permission } from '../constants/enumType';
import { IUserIdAndProjectId, ISharings } from '../types/interfaces';

declare module 'knex/types/tables' {
  interface KnexSharings {
    id: string;
    projectId: string;
    userId: string;
    permission: Permission;
  }

  interface Tables {
    sharings: KnexSharings;
  }
}

export function serializeSharings(record: KnexSharings): ISharings {
  return {
    id: record.id,
    projectId: record.projectId,
    userId: record.userId,
    permission: record.permission
  };
}

const knexClient = clients.knex.getInstance();

export default class SharingsModel {
  /**
   * create record to allow user access project
   * @param userIdAndProjectId
   */
  static createRecord = async (userIdAndProjectId: IUserIdAndProjectId) => {
    const { projectId, authorizedUserId } = userIdAndProjectId;

    // create new record
    if (
      // check if the permission not existed in DB
      (await this.usersCanAccessProjectCount({
        projectId,
        authorizedUserId
      })) === 0
    )
      // insert into db
      await knexClient<KnexSharings>('sharings').insert({
        projectId,
        userId: authorizedUserId,
        permission: Permission.Pending
      });
  };

  /**
   * list RecordsByProjectId
   * @param projectId @string
   * @returns {string[]}
   */
  static listRecordsByProjectId = async (projectId: string) => {
    const records = await knexClient('sharings')
      .where({ projectId })
      .select('userId', 'permission');

    return records;
  };

  /**
   * update permission of record
   * @param ISharings
   */
  static updatePermission = async (record: ISharings) => {
    const { projectId, permission, userId } = record;

    await knexClient<KnexSharings>('sharings')
      .where({
        projectId,
        userId
      })
      .update({ permission });
  };

  /**
   * check if user has permission to access project
   * @param userIdAndProjectId
   * @returns {count number of records}
   */
  static usersCanAccessProjectCount = async (
    userIdAndProjectId: IUserIdAndProjectId
  ) => {
    const { authorizedUserId, projectId } = userIdAndProjectId;

    const recordCount = await knexClient<KnexSharings>('sharings')
      .where({ userId: authorizedUserId, projectId })
      .count();

    return Number(recordCount[0].count);
  };

  /**
   * get permission of record
   * @param userIdAndProjectId
   * @returns {string}
   */
  static getPermissionOfRecord = async (
    userIdAndProjectId: IUserIdAndProjectId
  ) => {
    const { authorizedUserId, projectId } = userIdAndProjectId;

    const [record] = (
      await knexClient<KnexSharings>('sharings').where({
        projectId,
        userId: authorizedUserId
      })
    ).map(serializeSharings);

    return record.permission;
  };

  /**
   * delete record to remove user's authorization
   * @param userIdAndProjectId
   */
  static deleteRecord = async (userIdAndProjectId: IUserIdAndProjectId) => {
    const { projectId, authorizedUserId } = userIdAndProjectId;

    await knexClient<KnexSharings>('sharings')
      .where({ projectId, userId: authorizedUserId })
      .del();
  };

  /**
   *
   * @param ownerId
   * @returns {projectIds[]}
   */
  static listSharingProjectIds = async (ownerId: string) => {
    const projectIds = await knexClient('sharings')
      .where('userId', ownerId)
      .select('projectId');

    return projectIds.map((el) => el.projectId);
  };
}
