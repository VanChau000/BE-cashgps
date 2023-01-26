import { ApolloError } from 'apollo-server-express';
import { KnexCashEntryRow } from 'knex/types/tables';
import clients from '../clients';
import { OrderType } from '../constants/enumType';
import {
  IArgsGetEntryRowInGroup,
  ICashEntryRow,
  ICheckIfEntryRowExists,
  IGetCashEntryRow,
  IUpsertCashEntryRow
} from '../types/interfaces';
import { canUserHaveMoreRows } from '../utils/subscriptionLimit';

declare module 'knex/types/tables' {
  interface KnexCashEntryRow {
    id: string;
    projectId: string;
    ownerId: string;
    cashGroupId: string;
    name: string;
    rankOrder: number;
    displayMode: string;
  }

  interface Tables {
    cashEntryRows: KnexCashEntryRow;
  }
}

export function serializeCashEntryRow(
  cashEntryRow: KnexCashEntryRow
): ICashEntryRow {
  return {
    id: cashEntryRow.id,
    projectId: cashEntryRow.projectId,
    ownerId: cashEntryRow.ownerId,
    cashGroupId: cashEntryRow.cashGroupId,
    name: cashEntryRow.name,
    rankOrder: cashEntryRow.rankOrder,
    displayMode: cashEntryRow.displayMode
  };
}

const knexClient = clients.knex.getInstance();

export class CashEntryRowModel {
  /**
   * get cash entry row by Id
   * @param {IGetCashEntryRow}
   * @returns {CashEntryRow}
   */
  static getEntryRow = async ({
    cashEntryRowId,
    ownerId,
    projectId
  }: IGetCashEntryRow) => {
    try {
      const [entryRow] = (
        await knexClient('cashEntryRows').where({
          ownerId,
          projectId,
          id: cashEntryRowId as any
        })
      ).map(serializeCashEntryRow);

      return entryRow;
    } catch (error) {
      return undefined;
    }
  };

  /**
   * listEntryRowsInGroup
   * @param {IArgsGetEntryRowInGroup}
   * @returns {ICashEntryRow[]}
   */
  static listEntryRowsInGroup = async ({
    cashGroupId,
    ownerId,
    projectId
  }: IArgsGetEntryRowInGroup) => {
    const entryRows = (
      await knexClient('cashEntryRows')
        .where({
          cashGroupId,
          ownerId,
          projectId
        })
        .orderBy('rankOrder')
    ).map(serializeCashEntryRow);

    return entryRows;
  };

  /**
   * count entry row in group
   * @param cashGroupId
   * @param ownerId
   * @param projectId
   * @returns {number}
   */
  static countEntryRowsInGroup = async (
    cashGroupId: string,
    ownerId: string,
    projectId: string
  ) => {
    const sumOfEntryRows = await this.listEntryRowsInGroup({
      cashGroupId,
      ownerId,
      projectId
    });

    return sumOfEntryRows.length;
  };

  /**
   * createOrUpdateCashEntryRow
   * @param {IGetCashEntryRow}
   * @param {IUpsertCashEntryRow}
   * @returns {string}
   */
  static createOrUpdateCashEntryRow = async (
    { cashEntryRowId, ownerId, projectId }: IGetCashEntryRow,
    values: IUpsertCashEntryRow,
    orderType?: OrderType
  ) => {
    const entryRow = await this.getEntryRow({
      cashEntryRowId,
      ownerId,
      projectId
    });

    // update
    if (entryRow) {
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
        await knexClient('cashEntryRows')
          .where({
            ownerId,
            projectId,
            cashGroupId: entryRow.cashGroupId,
            rankOrder: entryRow.rankOrder + incOrDescRankOrder
          })
          .update('rankOrder', entryRow.rankOrder);

        // get the next rank order
        const rankOrder = (entryRow.rankOrder as number) + incOrDescRankOrder;

        // update row
        await knexClient('cashEntryRows')
          .where('id', cashEntryRowId)
          .update({ rankOrder });
      } else {
        // update row
        await knexClient('cashEntryRows')
          .where('id', entryRow.id)
          .update(values);

        // displayMode (USED or ARCHIVED, inherited from cashEntryRow)
        if (values?.displayMode)
          await knexClient('cashTransactions')
            .where('cashEntryRowId', entryRow.id)
            .update({ displayMode: values.displayMode });
      }
      return 'Entry row was updated';
    }

    // insert
    if (
      // check if user can have more row (subscription limit)
      await canUserHaveMoreRows(ownerId, projectId, values.cashGroupId as any)
    ) {
      // get the latest rank order
      const getMaxRankOrder = await knexClient.raw(
        `SELECT nullif ((SELECT "rankOrder" FROM "cashEntryRows" WHERE "cashGroupId" = '${values.cashGroupId}' ORDER BY "rankOrder" DESC LIMIT 1) ,0) as "maxRankOrder";`
      );

      // compute new rank order
      const rankOrder = getMaxRankOrder.rows[0].maxRankOrder + 1;
      await knexClient('cashEntryRows').insert({
        ...values,
        rankOrder,
        ownerId,
        projectId
      });

      return 'Entry row was inserted';
    }
    throw new ApolloError('Upgrade your subscription to perform this action.');
  };

  /**
   * store rank order after a drag-and-drop
   * @param {Array<string>} listRowIds
   * @returns {Promise<void>}
   */
  static storeRankAfterDragDrop = async (listRowIds: Array<string>) => {
    // map to update after the items be drag-drop
    listRowIds.map(async (id, i) => {
      await knexClient('cashEntryRows')
        .where({ id })
        .update('rankOrder', i + 1);
    });

    return 'Successful drag-and-drop';
  };

  /**
   * check if entry row name in group duplicated
   * @param ICheckIfEntryRowExists
   * @returns {Promise<boolean>}
   */
  static doesEntryRowExist = async ({
    cashGroupId,
    ownerId,
    projectId,
    name
  }: ICheckIfEntryRowExists) => {
    const cashEntryRowsInGroup = await this.listEntryRowsInGroup({
      cashGroupId,
      ownerId,
      projectId
    });

    return !!cashEntryRowsInGroup.find((el) => el.name === name);
  };

  /**
   * delete cash entry row
   * @param id
   * @returns {message}
   */
  static deleteCashEntryRow = async (id: string) => {
    // get the entry row
    const [cashEntryRow] = (
      await knexClient('cashEntryRows').where({ id })
    ).map(serializeCashEntryRow);

    // delete the row
    await knexClient('cashEntryRows').where('id', id).del();

    // decrease rows having rankOrder bigger than
    await knexClient('cashEntryRows')
      .where({ cashGroupId: cashEntryRow.cashGroupId })
      .where('rankOrder', '>', cashEntryRow.rankOrder)
      .decrement('rankOrder', 1);

    // delete all transactions in row in DB
    await knexClient('cashTransactions').where({ cashEntryRowId: id }).del();

    return 'Entry row was removed';
  };
}
