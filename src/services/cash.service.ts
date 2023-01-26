import { currenctDetails } from '../constants/currencyDetails';
import { CashProjectModel } from '../models/cashProject.model';
import UserModel from '../models/user.model';
import {
  IProjectIdAndOwnerId,
  ICashGroupFetchProject
} from '../types/interfaces';
import { filterTransactionsByDay } from '../utils/filterTransactions';
import { formatDate } from '../utils/formatPermissionText';
import CashEntryRowService from './cashEntryRow.service';
import CashGroupService from './cashGroup.service';
import CashProjectService from './cashProject.service';
import CashTransactionService from './cashTransaction.service';

export default class CashService {
  /**
   * fetch project data
   * @param IProjectIdAndOwnerId
   * @returns {fetchProject}
   */
  static fetchProject = async ({
    ownerId,
    projectId
  }: IProjectIdAndOwnerId) => {
    const project: any = {};

    const currentProject = await CashProjectService.getProjectById({
      projectId,
      ownerId
    });

    // declare the project object (Detail)
    const infoProject: any = {};

    infoProject.projectName = currentProject?.name;
    infoProject.startingBalance = currentProject?.startingBalance;
    infoProject.timezone = currentProject?.timezone;
    infoProject.currency = currentProject?.currency;
    infoProject.initialCashFlow = currentProject?.initialCashFlow;
    infoProject.startDate = currentProject?.startDate;
    infoProject.weekSchedule = currentProject?.weekSchedule;
    infoProject.currencySymbol = { ...currenctDetails }[
      infoProject.currency as string
    ]?.symbol;
    project.infoProject = infoProject;
    project.cashGroup = (await CashGroupService.getAllGroups({
      ownerId,
      projectId: projectId as string
    })) as ICashGroupFetchProject[];

    // get all data relating to project
    await Promise.all(
      (project.cashGroup as ICashGroupFetchProject[]).map(async (group) =>
        Promise.all(
          Object.assign(group, {
            cashEntryRow: await CashEntryRowService.listEntryRowsInGroup({
              cashGroupId: group.id as string,
              ownerId,
              projectId: projectId as string
            })
          }).cashEntryRow.map(async (row) => {
            const transactions =
              await CashTransactionService.listTransactionsInEntryRow({
                cashEntryRowId: row.id,
                cashGroupId: group.id,
                ownerId,
                projectId: projectId as string
              });
            return Object.assign(row, {
              transactions: filterTransactionsByDay(transactions)
            });
          })
        )
      )
    );

    // filter group IN & OUT
    const cashIns = project.cashGroup.filter(
      (group: any) => group.groupType === 'IN'
    );
    const cashOuts = project.cashGroup.filter(
      (group: any) => group.groupType === 'OUT'
    );
    project.cashGroup = [cashIns, cashOuts];

    // get the current subscription of user
    const {
      activeSubscription: ownerActiveSubscription,
      subscriptionExpiresAt
    } = await UserModel.getUserById(ownerId);

    return {
      ...project,
      ownerActiveSubscription,
      ownerSubscriptionExpiresAt: formatDate(subscriptionExpiresAt as any)
    };
  };
}
