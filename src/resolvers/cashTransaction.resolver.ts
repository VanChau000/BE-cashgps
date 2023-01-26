import { ApolloError } from 'apollo-server-express';
import CashTransactionService from '../services/cashTransaction.service';
import {
  IContext,
  IGetAllTransactionsInRowInDay,
  IIdsAndUpsertCashTransaction
} from '../types/interfaces';
import CashProjectService from '../services/cashProject.service';

const cashTransactionResolvers = {
  createOrUpdateCashEntry: async (
    _: undefined,
    args: { upsertTransactionArgs: IIdsAndUpsertCashTransaction },
    context: IContext
  ) => {
    const { projectId, transactions } = args.upsertTransactionArgs;

    // check user has permission to edit
    context.authorityWithProjects.forEach((el) => {
      if (el.projectId === projectId && el.permission !== 'EDIT')
        throw new ApolloError('You are not authorized to perform this action');
    });

    const ownerId = await CashProjectService.getOwnerIdOfProject(projectId);

    // the result of action upsert cash transaction
    const result = await CashTransactionService.createOrUpdateCashEntry(
      {
        ownerId,
        projectId
      },
      transactions
    );

    return { result };
  },

  listTransactionsInRowInDay: async (
    _: undefined,
    args: { getAllTransactionsInRowInDay: IGetAllTransactionsInRowInDay }
  ) => {
    const { cashEntryRowId, transactionDate } =
      args.getAllTransactionsInRowInDay;

    // list all tracsactions by row & day
    const transactions =
      await CashTransactionService.listTransactionsInRowInDay({
        cashEntryRowId,
        transactionDate
      });

    return transactions;
  },

  deleteCashTransaction: async (
    _: undefined,
    args: { deleteTransactionArgs: { id: string; projectId: string } },
    context: IContext
  ) => {
    const { id } = args.deleteTransactionArgs;

    // check projects can be editted or not
    context.authorityWithProjects.forEach((el) => {
      if (
        el.projectId === args.deleteTransactionArgs.projectId &&
        el.permission !== 'EDIT'
      )
        throw new ApolloError('You are not authorized to perform this action');
    });

    // the result of deletion transaction by ID
    const messageOfDeletion =
      await CashTransactionService.deleteCashTransaction(id);

    return { messageOfDeletion };
  }
};

export default cashTransactionResolvers;
