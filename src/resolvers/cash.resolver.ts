import { ApolloError } from 'apollo-server-express';
import CashService from '../services/cash.service';
import CashProjectService from '../services/cashProject.service';
import SharingService from '../services/sharing.service';
import { IContext } from '../types/interfaces';

const cashResolvers = {
  fetchProject: async (
    _: undefined,
    args: { projectId: string },
    context: IContext
  ) => {
    const { projectId } = args;
    try {
      /* FETCH PROJECTS - USER IS OWNER */
      // get ownerId of this project
      const ownerId = await CashProjectService.getOwnerIdOfProject(projectId);

      // return the project that current user is owner
      if (String(ownerId) === context.profile.id) {
        const project = await CashService.fetchProject({
          ownerId: context.profile.id,
          projectId
        });
        return project;
      }

      /* FETCH PROJECTS - BE SHARED */
      // get current user id
      const currentUserId = context.profile.id;

      // check user has permission with the project
      const userHasPermission = await SharingService.ifUserHasPermission({
        authorizedUserId: currentUserId,
        projectId
      });

      // get permission of user that shared
      const permission = await SharingService.getPermissionOfRecord({
        authorizedUserId: currentUserId,
        projectId
      });

      if (permission === 'PENDING') {
        throw new ApolloError('Not found', '404');
      } else if (userHasPermission) {
        const sharedProject = await CashService.fetchProject({
          ownerId,
          projectId
        });
        return { ...sharedProject, permission };
      }
      return {};
    } catch (error) {
      throw new ApolloError('Not found', '404');
    }
  }
};

export default cashResolvers;
