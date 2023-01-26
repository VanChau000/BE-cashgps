import { ApolloError } from 'apollo-server-express';
import CashGroupService from '../services/cashGroup.service';
import {
  IContext,
  IIdsAndUpsertCashGroup,
  IListGroupsByType
} from '../types/interfaces';
import CashProjectService from '../services/cashProject.service';

const cashGroupResolvers = {
  createOrUpdateCashGroup: async (
    _: undefined,
    args: { upsertGroupArgs: IIdsAndUpsertCashGroup },
    context: IContext
  ) => {
    const { groupId, projectId, upsertArgs, orderType } = args.upsertGroupArgs;

    // check user has permission to edit
    context.authorityWithProjects.forEach((el) => {
      if (el.projectId === projectId && el.permission !== 'EDIT')
        throw new ApolloError('You are not authorized to perform this action');
    });

    const ownerId = await CashProjectService.getOwnerIdOfProject(projectId);

    // the result of action upsert cash group
    const result = await CashGroupService.createOrUpdateCashGroup(
      {
        ownerId,
        projectId,
        groupId
      },
      upsertArgs,
      orderType
    );

    return { result };
  },

  listGroups: async (
    _: undefined,
    args: { projectId: string },
    context: IContext
  ) => {
    // list all projects of current user
    const groups = await CashGroupService.getAllGroups({
      ownerId: context.profile.id,
      projectId: args.projectId
    });

    // filter groups by type (IN & OUT)
    const filteredGroups = {
      in: groups.filter((group) => group.groupType === 'IN'),
      out: groups.filter((group) => group.groupType === 'OUT')
    };

    return { filteredGroups };
  },

  listGroupsByType: async (
    _: undefined,
    args: { listGroupsByType: IListGroupsByType },
    context: IContext
  ) => {
    const { groupType, projectId } = args.listGroupsByType;

    // list all groups
    const groups = await CashGroupService.getAllGroups({
      ownerId: context.profile.id,
      projectId
    });

    // filter by type
    return {
      groupsByType: groups.filter((group) => group.groupType === groupType)
    };
  },

  deleteCashGroup: async (
    _: undefined,
    args: { deleteGroupArgs: { id: string; projectId: string } },
    context: IContext
  ) => {
    // check projects can be editted or not
    context.authorityWithProjects.forEach((el) => {
      if (
        el.projectId === args.deleteGroupArgs.projectId &&
        el.permission !== 'EDIT'
      )
        throw new ApolloError('You are not authorized to perform this action');
    });

    // get the group Id that user want to remove
    const { id } = args.deleteGroupArgs;

    // the message of action delete group
    const messageOfDeletion = await CashGroupService.deleteCashGroup(id);

    return { messageOfDeletion };
  }
};

export default cashGroupResolvers;
