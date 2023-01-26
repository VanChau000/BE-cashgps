import { ApolloError } from 'apollo-server-express';
import { KnexCashGroup } from 'knex/types/tables';
import clients from '../clients';
import { DisplayMode, GroupType, OrderType } from '../constants/enumType';
import {
  ICashGroup,
  ICheckIfGroupExists,
  IGetCashGroup,
  IProjectIdAndOwnerId,
  IUpsertCashGroup
} from '../types/interfaces';
import { canUserHaveMoreGroups } from '../utils/subscriptionLimit';
import { CashEntryRowModel, serializeCashEntryRow } from './cashEntryRow.model';

declare module 'knex/types/tables' {
  interface KnexCashGroup {
    id: string;
    projectId: string;
    ownerId: string;
    name: string;
    groupType: GroupType;
    rankOrder: number;
    displayMode: DisplayMode;
  }

  interface Tables {
    cashGroups: KnexCashGroup;
  }
}

export function serializeCashGroup(cashGroup: KnexCashGroup): ICashGroup {
  return {
    id: cashGroup.id,
    projectId: cashGroup.projectId,
    ownerId: cashGroup.ownerId,
    name: cashGroup.name,
    groupType: cashGroup.groupType,
    rankOrder: cashGroup.rankOrder,
    displayMode: cashGroup.displayMode
  };
}

const knexClient = clients.knex.getInstance();

export class CashGroupModel {
  /**
   * get cash group by id
   * @param {groupId, ownerId, projectId}
   * @returns {group}
   */
  static getGroup = async ({ groupId, ownerId, projectId }: IGetCashGroup) => {
    try {
      const [group] = (
        await knexClient('cashGroups').where({
          id: groupId as string,
          projectId,
          ownerId
        })
      ).map(serializeCashGroup);
      return group;
    } catch (error) {
      return undefined;
    }
  };

  /**
   * get all groups
   * @param {ownerId, projectId}
   * @returns {[group]}
   */
  static getAllGroups = async ({
    ownerId,
    projectId
  }: IProjectIdAndOwnerId) => {
    const groups = (
      await knexClient('cashGroups')
        .where({
          projectId: projectId as string,
          ownerId
        })
        .orderBy('rankOrder')
    ).map(serializeCashGroup);

    return groups;
  };

  /**
   * upsert cash group
   * @param { groupId, ownerId, projectId }
   * @param {IUpsertCashGroup}
   * @returns {string}
   */
  static createOrUpdateCashGroup = async (
    { groupId, ownerId, projectId }: IGetCashGroup,
    values: IUpsertCashGroup,
    orderType?: OrderType
  ) => {
    const group = await this.getGroup({ groupId, ownerId, projectId });

    // update
    if (group) {
      if (orderType) {
        let incOrDescRankOrder;
        switch (orderType) {
          case 'UP':
            incOrDescRankOrder = -1;
            break;
          case 'DOWN':
            incOrDescRankOrder = 1;
            break;
          default:
            incOrDescRankOrder = 0;
            break;
        }

        // change rank order the swapped item
        await knexClient('cashGroups')
          .where({
            ownerId,
            projectId,
            groupType: group.groupType,
            rankOrder: group.rankOrder + incOrDescRankOrder
          })
          .update('rankOrder', group.rankOrder);

        // get the next rank order
        const rankOrder = (group.rankOrder as number) + incOrDescRankOrder;

        // update the group
        await knexClient('cashGroups')
          .where('id', group.id)
          .update({ rankOrder });
      } else {
        await knexClient('cashGroups').where('id', group.id).update(values);
      }
      return 'Group was updated';
    }

    // insert
    if (
      // check user can have more groups (subscription limit)
      await canUserHaveMoreGroups(ownerId, projectId, values.groupType as any)
    ) {
      // get the max rank order
      const getMaxRankOrder = await knexClient.raw(
        `SELECT nullif ((SELECT "rankOrder" FROM "cashGroups" WHERE "projectId" = '${projectId}' AND "groupType" = '${values.groupType}' ORDER BY "rankOrder" DESC LIMIT 1) ,0) as "maxRankOrder";`
      );

      // get the next rank order
      const rankOrder = getMaxRankOrder.rows[0].maxRankOrder + 1;

      // insert group
      await knexClient('cashGroups').insert({
        ...values,
        rankOrder,
        ownerId,
        projectId
      });

      return 'Group was inserted';
    }
    throw new ApolloError('Upgrade your subscription to perform this action.');
  };

  /**
   * count groups by type
   * @param ownerId
   * @param projectId
   * @param groupType
   * @returns {number}
   */
  static countGroupsByType = async (
    ownerId: string,
    projectId: string,
    groupType: GroupType
  ) => {
    const sumOfGroups = (
      await this.getAllGroups({ ownerId, projectId })
    ).filter((el) => el.groupType === groupType).length;
    return sumOfGroups;
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
  }: ICheckIfGroupExists) => {
    const filterGroupNamesByType = await knexClient('cashGroups')
      .where({
        projectId,
        ownerId,
        groupType
      })
      .select('name');
    return !!filterGroupNamesByType.find((el) => el.name === name);
  };

  /**
   * delete cash group
   * @param id
   * @returns {message}
   */
  static deleteCashGroup = async (id: string) => {
    const [cashGroup] = (await knexClient('cashGroups').where({ id })).map(
      serializeCashGroup
    );

    // delete the cash group
    await knexClient('cashGroups').where({ id }).del();

    // decrease groups having rankOrder bigger than
    await knexClient('cashGroups')
      .where({ projectId: cashGroup.projectId, groupType: cashGroup.groupType })
      .where('rankOrder', '>', cashGroup.rankOrder)
      .decrement('rankOrder', 1);

    // delete rows (with transactions) in group
    (await knexClient('cashEntryRows').where('cashGroupId', id))
      .map(serializeCashEntryRow)
      .map(async (row) => await CashEntryRowModel.deleteCashEntryRow(row.id));

    return 'Cash group was removed';
  };
}
