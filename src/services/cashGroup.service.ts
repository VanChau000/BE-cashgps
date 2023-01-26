import { UserInputError } from 'apollo-server-express';
import { GroupType, OrderType } from '../constants/enumType';
import { CashGroupModel } from '../models/cashGroup.model';
import {
  ICheckIfGroupExists,
  IGetCashGroup,
  IProjectIdAndOwnerId,
  IUpsertCashGroup
} from '../types/interfaces';
import { CashProjectModel } from '../models/cashProject.model';

export default class CashGroupService {
  /**
   * createOrUpdateCashGroup
   * @param {IGetCashGroup}
   * @param {IUpsertCashGroup}
   * @returns
   */
  static createOrUpdateCashGroup = async (
    { groupId, ownerId, projectId }: IGetCashGroup,
    values: IUpsertCashGroup,
    orderType?: OrderType
  ) => {
    // check owner of project
    const ownerIdOfCurrentProject = await CashProjectModel.getOwnerIdOfProject(
      projectId
    );

    // check if group name existed before upsert
    const group = await this.getGroup({
      groupId,
      ownerId: ownerIdOfCurrentProject,
      projectId
    });
    if (
      (group &&
        values?.name &&
        group.name !== values.name &&
        (await this.doesGroupNameExist({
          groupType: group.groupType,
          name: values.name,
          ownerId,
          projectId
        }))) ||
      (!group &&
        (await this.doesGroupNameExist({
          groupType: values.groupType as GroupType,
          name: values.name as string,
          ownerId,
          projectId
        })))
    ) {
      return 'Group name already exists. Please try with another.';
    }

    // the result of action upsert cash group
    const result = await CashGroupModel.createOrUpdateCashGroup(
      {
        ownerId,
        projectId,
        groupId
      },
      values,
      orderType
    );

    return result;
  };

  /**
   * check if group name exists
   * @param ICheckIfGroupExists
   * @returns {boolean}
   */
  static doesGroupNameExist = async ({
    groupType,
    ownerId,
    projectId,
    name
  }: ICheckIfGroupExists) =>
    await CashGroupModel.doesGroupNameExist({
      groupType,
      ownerId,
      projectId,
      name
    });

  /**
   * getAllGroups
   * @param {IProjectIdAndOwnerId}
   * @returns {groups}
   */
  static getAllGroups = async ({
    ownerId,
    projectId
  }: IProjectIdAndOwnerId) => {
    // get all groups of project
    const groups = await CashGroupModel.getAllGroups({ ownerId, projectId });

    return groups;
  };

  /**
   * get group
   * @param IGetCashGroup
   * @returns {group}
   */
  static getGroup = async ({ groupId, ownerId, projectId }: IGetCashGroup) => {
    // get group by id
    const group = await CashGroupModel.getGroup({
      groupId,
      ownerId,
      projectId
    });

    return group;
  };

  static deleteCashGroup = async (id: string) =>
    await CashGroupModel.deleteCashGroup(id);
}
