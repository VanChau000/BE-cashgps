import cashResolvers from './cash.resolver';
import cashEntryRowResolvers from './cashEntryRow.resolver';
import cashGroupResolvers from './cashGroup.resolver';
import cashProjectResolvers from './cashProject.resolver';
import cashTransactionResolvers from './cashTransaction.resolver';
import planResolvers from './plan.resolver';
import sharingResolvers from './sharing.resolver';
import userResolvers from './user.resolver';

const resolvers = {
  Query: {
    getUser: userResolvers.getUser,
    fetchProject: cashResolvers.fetchProject,
    listProjects: cashProjectResolvers.listProjects,
    getProjectInfo: cashProjectResolvers.getProjectInfo,
    listGroups: cashGroupResolvers.listGroups,
    listGroupsByType: cashGroupResolvers.listGroupsByType,
    listEntryRowsInGroup: cashEntryRowResolvers.listEntryRowsInGroup,
    listInfoOfAuthorizedUsersWithProject:
      sharingResolvers.listInfoOfAuthorizedUsersWithProject,
    getPlan: planResolvers.getPlan,
    listPlans: planResolvers.listPlans,
    listTransactionsInRowInDay:
      cashTransactionResolvers.listTransactionsInRowInDay
  },

  Mutation: {
    updateUserProfile: userResolvers.updateUser,
    changePassword: userResolvers.changePassword,
    isLinkResetPasswordExpired: userResolvers.isLinkResetPasswordExpired,
    startFreeTrialPlan: userResolvers.startFreeTrialPlan,
    createOrUpdateCashProject: cashProjectResolvers.createOrUpdateCashProject,
    deleteCashProject: cashProjectResolvers.deleteProject,
    createOrUpdateCashGroup: cashGroupResolvers.createOrUpdateCashGroup,
    deleteCashGroup: cashGroupResolvers.deleteCashGroup,
    createOrUpdateCashEntryRow:
      cashEntryRowResolvers.createOrUpdateCashEntryRow,
    listEntryRowsInGroup: cashEntryRowResolvers.listEntryRowsInGroup,
    storeRankAfterDragDrop: cashEntryRowResolvers.storeRankAfterDragDrop,
    deleteCashEntryRow: cashEntryRowResolvers.deleteCashEntryRow,
    createOrUpdateCashEntry: cashTransactionResolvers.createOrUpdateCashEntry,
    deleteCashTransaction: cashTransactionResolvers.deleteCashTransaction,
    invite: sharingResolvers.invite,
    updatePermission: sharingResolvers.updatePermission,
    deleteRecord: sharingResolvers.deleteRecord
  }
};

export default resolvers;
