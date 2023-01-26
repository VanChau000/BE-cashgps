import { ApolloError } from 'apollo-server-express';
import CashEntryRowService from '../services/cashEntryRow.service';
import {
  ICashGroupIdAndProjectId,
  IContext,
  IIdsAndUpsertCashEntryRow
} from '../types/interfaces';
import CashProjectService from '../services/cashProject.service';

const cashEntryRowResolvers = {
  /**
   * upsert cash entry row
   * @param _
   * @param args @IIdsAndUpsertCashEntryRow
   * @param context @IContext
   * @returns {message}
   */
  createOrUpdateCashEntryRow: async (
    _: undefined,
    args: { upsertEntryRowArgs: IIdsAndUpsertCashEntryRow },
    context: IContext
  ) => {
    const { projectId, cashEntryRowId } = args.upsertEntryRowArgs;

    // check user has permission to edit
    context.authorityWithProjects.forEach((el) => {
      if (el.projectId === projectId && el.permission !== 'EDIT')
        throw new ApolloError('You are not authorized to perform this action');
    });

    const ownerId = await CashProjectService.getOwnerIdOfProject(projectId);

    // the result of action upsert cash entry row
    const result = await CashEntryRowService.createOrUpdateCashEntryRow(
      {
        ownerId,
        cashEntryRowId,
        projectId
      },
      args.upsertEntryRowArgs.upsertArgs,
      args.upsertEntryRowArgs.orderType
    );

    return { result };
  },

  /**
   * list all entry rows in a group
   * @param _
   * @param args
   * @param context
   * @returns {entryRows[]}
   */
  listEntryRowsInGroup: async (
    _: undefined,
    args: { listEntryRowInGroupArgs: ICashGroupIdAndProjectId },
    context: IContext
  ) => {
    const { cashGroupId, projectId } = args.listEntryRowInGroupArgs;

    const entryRows = await CashEntryRowService.listEntryRowsInGroup({
      cashGroupId,
      ownerId: context.profile.id,
      projectId
    });

    return entryRows;
  },

  /**
   * store rank order by list
   * @param _
   * @param {any} args
   */
  storeRankAfterDragDrop: async (
    _: undefined,
    args: { listRowIds: string[] }
  ) => {
    const { listRowIds } = args;

    const resultOfDragDrop = await CashEntryRowService.storeRankAfterDragDrop(
      listRowIds
    );

    return { resultOfDragDrop };
  },

  /**
   * delete cash entry row
   * @param _
   * @param id @string
   * @returns {message}
   */
  deleteCashEntryRow: async (
    _: undefined,
    args: { deleteRowArgs: { id: string } }
  ) => {
    const { id } = args.deleteRowArgs;

    const messageOfDeletion = await CashEntryRowService.deleteCashEntryRow(id);

    return { messageOfDeletion };
  }
};

export default cashEntryRowResolvers;
