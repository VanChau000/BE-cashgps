import { ActiveSubscription, GroupType } from '../constants/enumType';
import { plans } from '../constants/limitPlan';
import { CashEntryRowModel } from '../models/cashEntryRow.model';
import { CashGroupModel } from '../models/cashGroup.model';
import { CashProjectModel } from '../models/cashProject.model';
import SharingsModel from '../models/sharing.model';
import UserModel from '../models/user.model';

export const canUserHaveMoreProjects = async (ownerId: string) => {
  const projectsCount = await CashProjectModel.countProjects(ownerId);

  let { activeSubscription } = await UserModel.getUserById(ownerId);

  if (!activeSubscription) return false;

  activeSubscription = activeSubscription.split(' ')[1] || activeSubscription;

  const projectsCanBeOwned =
    plans[activeSubscription as ActiveSubscription].projectsCount;

  return typeof projectsCanBeOwned === 'string'
    ? true
    : projectsCount < projectsCanBeOwned;
};

export const canUserHaveMoreGroups = async (
  ownerId: string,
  projectId: string,
  groupType: GroupType
) => {
  const groupsCount = await CashGroupModel.countGroupsByType(
    ownerId,
    projectId,
    groupType
  );

  let { activeSubscription } = await UserModel.getUserById(ownerId);

  if (!activeSubscription) return false;
  activeSubscription = activeSubscription.split(' ')[1] || activeSubscription;

  const groupsCanBeOwned =
    plans[activeSubscription as ActiveSubscription].groupsPerTypeCount;

  return typeof groupsCanBeOwned === 'string'
    ? true
    : groupsCount < groupsCanBeOwned;
};

export const canUserHaveMoreRows = async (
  ownerId: string,
  projectId: string,
  groupId: string
) => {
  const entryRowsCount = await CashEntryRowModel.countEntryRowsInGroup(
    groupId,
    ownerId,
    projectId
  );

  let { activeSubscription } = await UserModel.getUserById(ownerId);

  if (!activeSubscription) return false;

  activeSubscription = activeSubscription.split(' ')[1] || activeSubscription;

  const rowsPerGroupCanBeOwned =
    plans[activeSubscription as ActiveSubscription].rowsPerGroupCount;

  return typeof rowsPerGroupCanBeOwned === 'string'
    ? true
    : entryRowsCount < rowsPerGroupCanBeOwned;
};

export const canUserShareProjects = async (ownerId: string) => {
  let { activeSubscription } = await UserModel.getUserById(ownerId);

  if (!activeSubscription) return false;

  activeSubscription = activeSubscription.split(' ')[1] || activeSubscription;

  return plans[activeSubscription as ActiveSubscription].hasFeatureSharing;
};

export const canOwnerShareMore = async (ownerId: string, projectId: string) => {
  const recordsCount = (await SharingsModel.listRecordsByProjectId(projectId))
    .length;

  let { activeSubscription } = await UserModel.getUserById(ownerId);

  if (!activeSubscription) return false;

  activeSubscription = activeSubscription.split(' ')[1] || activeSubscription;

  const usersBeSharedCount =
    plans[activeSubscription as ActiveSubscription].usersBeSharedCount;

  return typeof usersBeSharedCount === 'string'
    ? true
    : recordsCount < usersBeSharedCount;
};
