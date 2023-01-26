import { OrderType } from '../constants/enumType';
import { CashEntryRowModel } from '../models/cashEntryRow.model';
import {
  IArgsGetEntryRowInGroup,
  ICheckIfEntryRowExists,
  IGetCashEntryRow,
  IUpsertCashEntryRow
} from '../types/interfaces';

export default class CashEntryRowService {
  /**
   * createOrUpdateCashEntryRow
   * @param IGetCashEntryRow
   * @param IUpsertCashEntryRow
   * @returns
   */
  static createOrUpdateCashEntryRow = async (
    { ownerId, projectId, cashEntryRowId }: IGetCashEntryRow,
    values: IUpsertCashEntryRow,
    orderType?: OrderType
  ) => {
    // check if entry row name duplicated
    const row = await this.getEntryRow({
      cashEntryRowId,
      ownerId,
      projectId
    });

    if (
      (row &&
        values?.name &&
        row.name !== values?.name &&
        (await this.doesEntryRowExist({
          cashGroupId: row.cashGroupId,
          name: values.name,
          ownerId,
          projectId
        }))) ||
      (!row &&
        (await this.doesEntryRowExist({
          cashGroupId: values.cashGroupId as string,
          name: values.name as string,
          ownerId,
          projectId
        })))
    ) {
      return 'Category name already exists. Please try with another.';
    }

    // the result of action upsert row
    const result = await CashEntryRowModel.createOrUpdateCashEntryRow(
      {
        cashEntryRowId,
        ownerId,
        projectId
      },
      values,
      orderType
    );
    return result;
  };

  /**
   * check if entry row name in group duplicated
   * @param ICheckIfEntryRowExists
   */
  static doesEntryRowExist = async ({
    cashGroupId,
    name,
    ownerId,
    projectId
  }: ICheckIfEntryRowExists) =>
    await CashEntryRowModel.doesEntryRowExist({
      cashGroupId,
      name,
      ownerId,
      projectId
    });

  /**
   * getEntryRow
   * @param IGetCashEntryRow
   * @returns {entryRow}
   */
  static getEntryRow = async ({
    cashEntryRowId,
    ownerId,
    projectId
  }: IGetCashEntryRow) => {
    // get single entry row by id
    const entryRow = await CashEntryRowModel.getEntryRow({
      cashEntryRowId,
      ownerId,
      projectId
    });

    return entryRow;
  };

  /**
   * list entry rows in a group IN/OUT
   * @param { cashGroupId, ownerId, projectId }
   * @returns {ICashEntryRow}
   */
  static listEntryRowsInGroup = async ({
    cashGroupId,
    ownerId,
    projectId
  }: IArgsGetEntryRowInGroup) => {
    // list all entry rows in group
    const entryRows = await CashEntryRowModel.listEntryRowsInGroup({
      cashGroupId,
      ownerId,
      projectId
    });

    return entryRows;
  };

  /**
   * store rank order after a drag-and-drop
   * @param {string[]} listRowIds
   */
  static storeRankAfterDragDrop = async (listRowIds: Array<string>) =>
    await CashEntryRowModel.storeRankAfterDragDrop(listRowIds);

  /**
   * delete cash entry row
   * @param id
   * @returns {message}
   */
  static deleteCashEntryRow = async (id: string) =>
    await CashEntryRowModel.deleteCashEntryRow(id);
}
