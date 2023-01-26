import { KnexCashTransaction } from 'knex/types/tables';
import { tail } from 'lodash';
import clients from '../clients';
import knex from '../clients/knex';
import { DisplayMode, FrequencyType, GroupType } from '../constants/enumType';
import {
  ICashTransaction,
  IConvertCurrency,
  IGetAllTransactionsInRowInDay,
  IGetCashTransaction,
  IListTransactionsInRow,
  IUpsertCashTransaction
} from '../types/interfaces';
import { CashEntryRowModel } from './cashEntryRow.model';

declare module 'knex/types/tables' {
  interface KnexCashTransaction {
    id: string;
    projectId: string;
    ownerId: string;
    cashGroupId: string;
    cashEntryRowId: string;
    description: string;
    displayMode: DisplayMode;
    transactionDate: string;
    estimatedValue: number;
    value: number;
    frequency: FrequencyType;
    frequencyStopAt: string;
    parentId: string | null;
  }

  interface Tables {
    cashTransactions: KnexCashTransaction;
  }
}

export function serializeCashTransaction(
  cashTransaction: KnexCashTransaction
): ICashTransaction {
  return {
    id: cashTransaction.id,
    projectId: cashTransaction.projectId,
    ownerId: cashTransaction.ownerId,
    cashGroupId: cashTransaction.cashGroupId,
    cashEntryRowId: cashTransaction.cashEntryRowId,
    description: cashTransaction.description,
    displayMode: cashTransaction.displayMode,
    transactionDate: cashTransaction.transactionDate,
    estimatedValue: cashTransaction.estimatedValue,
    value: cashTransaction.value,
    frequency: cashTransaction.frequency,
    frequencyStopAt: cashTransaction.frequencyStopAt,
    parentId: cashTransaction.parentId
  };
}

const knexClient = clients.knex.getInstance();

export class CashTransactionModel {
  /**
   * get cash transaction by id
   * @param {IGetCashTransaction}
   * @returns {transaction}
   */
  static getCashTransaction = async ({
    cashTransactionId,
    ownerId,
    projectId
  }: IGetCashTransaction) => {
    try {
      const [transaction] = (
        await knexClient('cashTransactions').where({
          ownerId,
          projectId,
          id: cashTransactionId as any
        })
      ).map(serializeCashTransaction);

      return transaction;
    } catch (error) {
      return undefined;
    }
  };

  /**
   * list Transactions In Entry Row
   * @param {IListTransactionsInRow}
   * @returns {ICashTransaction[]}
   */
  static listTransactionsInEntryRow = async ({
    cashEntryRowId,
    cashGroupId,
    ownerId,
    projectId
  }: IListTransactionsInRow) => {
    // get the transactions (order by date and createAt)
    const transactions = (
      await knexClient('cashTransactions')
        .where({
          ownerId,
          projectId,
          cashGroupId,
          cashEntryRowId
        })
        .orderBy('transactionDate', 'asc')
        .orderByRaw('"createdAt" ASC NULLS LAST')
    ).map(serializeCashTransaction);

    return transactions;
  };

  /**
   * upsert cash transaction
   * @param {IUpsertCashTransaction}
   * @param {IUpsertCashTransaction}
   * @returns {string}
   */
  static createOrUpdateCashEntry = async (
    { ownerId, projectId }: IGetCashTransaction,
    values: [{ cashTransactionId: string; upsertArgs: IUpsertCashTransaction }]
  ) => {
    const transaction = await this.getCashTransaction({
      cashTransactionId: values[0].cashTransactionId,
      ownerId,
      projectId
    });

    if (transaction) {
      const sameParentID = await knexClient('cashTransactions').where(
        'parentId',
        transaction.id
      );

      const findExistedIdToUpdateMany = await knexClient(
        'cashTransactions'
      ).where('id', transaction.id);
      const frequencyOfOldTransaction = findExistedIdToUpdateMany[0].frequency;

      if (transaction.frequency === null && values.length === 1) {
        if (transaction.parentId !== null) {
          // update single child transaction and separate child from his parent payload is child trans
          await knexClient('cashTransactions')
            .where('id', transaction.id)
            .update({ ...values[0].upsertArgs, parentId: null });
          // child transaction was upadte
          return 'Transaction was updated';
        }
        if (transaction.parentId === null) {
          await knexClient('cashTransactions')
            .where('id', transaction.id)
            .update(values[0].upsertArgs);
        }

        return 'Transaction was updated';
      }

      // update all transaction includes parent and children transaction one playload is parent
      if (
        sameParentID.length > 0 &&
        transaction.frequency !== null &&
        values[0].upsertArgs.frequency === frequencyOfOldTransaction &&
        transaction.value !== values[0].upsertArgs.value &&
        values.length === 1
      ) {
        const { transactionDate, ...inputData } = values[0].upsertArgs;
        // update child
        await knexClient('cashTransactions')
          .where('parentId', transaction.id)
          .update({
            ...inputData,
            frequency: null as any,
            frequencyStopAt: null as any
          });
        // update parent
        await knexClient('cashTransactions')
          .where('id', transaction.id)
          .update({ ...values[0].upsertArgs });
        return 'Transaction was updated';
      }

      // delete old child transacions before modify and add more
      if (
        (findExistedIdToUpdateMany &&
          values.length > 0 &&
          values[0].upsertArgs.frequency !== frequencyOfOldTransaction) ||
        values[0].upsertArgs.frequency === frequencyOfOldTransaction
      ) {
        await knexClient('cashTransactions')
          .where('parentId', transaction.id)
          .del();
        // after delete add new arr of transactions frequency
        const splitDuplicateTransaction = tail(values);

        await knexClient('cashTransactions')
          .where('id', transaction.id)
          .update({ ...values[0].upsertArgs });

        const transactions = await Promise.all(
          splitDuplicateTransaction.map(async (el: any) => {
            const cashEntryRow = await CashEntryRowModel.getEntryRow({
              cashEntryRowId: el.upsertArgs.cashEntryRowId || null,
              ownerId,
              projectId
            });
            return {
              ...el.upsertArgs,
              projectId,
              ownerId,
              id: el.cashTransactionId,
              cashGroupId: cashEntryRow?.cashGroupId as any,
              parentId:
                el.upsertArgs.frequency !== null
                  ? null
                  : values[0].cashTransactionId
            };
          })
        );
        await knexClient('cashTransactions').insert(transactions as any);
        return 'Transaction was updated';
      }

      // update transaction frequency with exsited child transasction payload is arr of child update trans
      if (
        findExistedIdToUpdateMany &&
        values.length > 0 &&
        values[0].upsertArgs.frequency !== null
      ) {
        const splitDuplicateTransaction = tail(values);

        await knexClient('cashTransactions')
          .where('id', transaction.id)
          .update({ ...values[0].upsertArgs });

        const transactions = await Promise.all(
          splitDuplicateTransaction.map(async (el: any) => {
            const cashEntryRow = await CashEntryRowModel.getEntryRow({
              cashEntryRowId: el.upsertArgs.cashEntryRowId || null,
              ownerId,
              projectId
            });
            return {
              ...el.upsertArgs,
              projectId,
              ownerId,
              id: el.cashTransactionId,
              cashGroupId: cashEntryRow?.cashGroupId as any,
              parentId:
                el.upsertArgs.frequency !== null
                  ? null
                  : values[0].cashTransactionId
            };
          })
        );
        await knexClient('cashTransactions').insert(transactions as any);
        return 'Transaction was updated';
      }
    }

    // add one or all transaction play load is an array
    const transactions = await Promise.all(
      values.map(async (el: any) => {
        const cashEntryRow = await CashEntryRowModel.getEntryRow({
          cashEntryRowId: el.upsertArgs.cashEntryRowId || null,
          ownerId,
          projectId
        });
        return {
          ...el.upsertArgs,
          projectId,
          ownerId,
          id: el.cashTransactionId,
          cashGroupId: cashEntryRow?.cashGroupId as any,
          parentId:
            el.upsertArgs.frequency !== null
              ? null
              : values[0].cashTransactionId
        };
      })
    );

    await knexClient('cashTransactions').insert(transactions as any);

    return 'Transaction was inserted';
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
    const transactions = (
      await knexClient('cashTransactions')
        .where({
          cashEntryRowId,
          transactionDate
        })
        .select('*')
    ).map(serializeCashTransaction);

    return transactions;
  };

  /**
   * convert value of transaction after alter project's currency
   * @param IConvertCurrency
   * @returns {string}
   */
  static convertCurrency = async ({
    ownerId,
    projectId,
    rate
  }: IConvertCurrency) => {
    // convert the actual value
    await knexClient.raw(
      `update "cashTransactions" set value = (value * ${rate} ) where "ownerId" = ${ownerId} and "projectId" = ${projectId}`
    );

    // convert the estimated value
    await knexClient.raw(
      `update "cashTransactions" set "estimatedValue" = ("estimatedValue" * ${rate} ) where "ownerId" = ${ownerId} and "projectId" = ${projectId}`
    );

    return 'Successfully converted.';
  };

  /**
   * delete cash transaction
   * @param id
   * @returns {message}
   */
  static deleteCashTransaction = async (id: string) => {
    // delete the transaction
    const findParentId = await knexClient("cashTransactions").where('parentId', id)
    if (findParentId.length) {
      await knexClient('cashTransactions')
        .where({ parentId: id })
        .del();
    }

    await knexClient('cashTransactions').where({ id }).del();

    return 'Cash transaction was removed';
  };
}
