import { CashTransactionModel } from '../models/cashTransaction.model';
import {
  IConvertCurrency,
  IGetAllTransactionsInRowInDay,
  IGetCashTransaction,
  IListTransactionsInRow,
  IUpsertCashTransaction
} from '../types/interfaces';

export default class CashTransactionService {
  /**
   * createOrUpdateCashEntry
   * @param IGetCashTransaction
   * @param IUpsertCashTransaction
   * @returns {string}
   */
  static createOrUpdateCashEntry = async (
    { ownerId, projectId }: IGetCashTransaction,
    values: [{ cashTransactionId: string; upsertArgs: IUpsertCashTransaction }]
  ) => {
    // the result of action upsert transaction
    const result = await CashTransactionModel.createOrUpdateCashEntry(
      {
        ownerId,
        projectId
      },
      values
    );

    return result;
  };

  /**
   * convert value of transaction after alter project's currency
   * @param IConvertCurrency
   */
  static convertCurrency = async ({
    ownerId,
    projectId,
    rate
  }: IConvertCurrency) => {
    await CashTransactionModel.convertCurrency({ ownerId, projectId, rate });
  };

  /**
   * listTransactionsInEntryRow
   * @param {IListTransactionsInRow}
   * @returns {ICashTransaction[]}
   */
  static listTransactionsInEntryRow = async ({
    cashEntryRowId,
    cashGroupId,
    ownerId,
    projectId
  }: IListTransactionsInRow) => {
    // list all transactions in row
    const transactions = await CashTransactionModel.listTransactionsInEntryRow({
      cashEntryRowId,
      cashGroupId,
      ownerId,
      projectId
    });

    return transactions;
  };

  /**
   * list all subscriptions in a row in day
   * @param IGetAllTransactionsInRowInDay
   * @returns {ICashTransaction[]}
   */
  static listTransactionsInRowInDay = async ({
    cashEntryRowId,
    transactionDate
  }: IGetAllTransactionsInRowInDay) => {
    // list all transactions in row in day
    const transactions = await CashTransactionModel.listTransactionsInRowInDay({
      cashEntryRowId,
      transactionDate
    });

    return transactions;
  };

  /**
   * delete cash transaction
   * @param id
   */
  static deleteCashTransaction = async (id: string) =>
    await CashTransactionModel.deleteCashTransaction(id);
}
