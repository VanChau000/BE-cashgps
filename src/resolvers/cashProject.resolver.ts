import { ApolloError } from 'apollo-server-express';
import CashProjectService from '../services/cashProject.service';
import { IContext, IIdAndUpsertCashProject } from '../types/interfaces';

const cashProjectResolvers = {
  /**
   * upsert CashProject
   * @param _
   * @param args @IIdAndUpsertCashProject
   * @param context @IContext
   * @returns
   */
  createOrUpdateCashProject: async (
    _: undefined,
    args: { upsertProjectArgs: IIdAndUpsertCashProject },
    context: IContext
  ) => {
    const { projectId } = args.upsertProjectArgs;

    // check user has permission to edit
    context.authorityWithProjects.forEach((el) => {
      if (el.projectId === projectId && el.permission !== 'EDIT')
        throw new ApolloError('You are not authorized to perform this action');
    });

    const ownerId = projectId
      ? await CashProjectService.getOwnerIdOfProject(projectId)
      : context.profile.id;

    // the result of action upsert cash project
    const result = await CashProjectService.createOrUpdateCashProject(
      {
        ownerId,
        projectId
      },
      args.upsertProjectArgs
    );

    return { result };
  },

  /**
   * list projects
   * @param _
   * @param __
   * @param context
   * @returns {projects[]}
   */
  listProjects: async (_: undefined, __: undefined, context: IContext) => {
    // list all projects of owner
    const projects = await CashProjectService.listProjects(context.profile.id);

    return projects;
  },

  /**
   * get Project Info
   * @param _
   * @param args @projectId
   * @param context @IContext
   * @returns
   */
  getProjectInfo: async (
    _: undefined,
    args: { projectId: string },
    context: IContext
  ) => {
    // get project by ID
    const project = await CashProjectService.getProjectById({
      ownerId: context.profile.id,
      projectId: args.projectId
    });

    return project;
  },

  /**
   * delete project
   * @param _
   * @param args @projectId
   * @param context @IContext
   * @returns {string}
   */
  deleteProject: async (
    _: undefined,
    args: { projectId: string },
    context: IContext
  ) => {
    const { projectId } = args;

    // the result of project deletion
    const messageOfDeletion = await CashProjectService.deleteProject({
      projectId,
      ownerId: context.profile.id
    });

    return { messageOfDeletion };
  }
};

export default cashProjectResolvers;
