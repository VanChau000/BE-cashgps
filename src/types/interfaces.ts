import {
  DisplayMode,
  FrequencyType,
  GroupType,
  OrderType,
  Permission,
  Recurring
} from '../constants/enumType';

// cash project
export interface ICashProject {
  id: string;
  ownerId: string;
  name: string;
  startingBalance: number;
  timezone: string;
  currency: string;
  initialCashFlow: string;
  startDate: string;
  weekSchedule: number;
}

export interface IFetchProject {
  projectId: string;
}

export interface IUpsertCashProject {
  name?: string;
  startingBalance?: number;
  timezone?: string;
  currency?: string;
  startDate?: string;
  weekSchedule?: number;
}

export interface IIdAndUpsertCashProject {
  projectId: string;
  upsertArgs: IUpsertCashProject;
  saturdayOrSunday: [boolean, boolean];
}

export interface IProjectIdAndOwnerId {
  projectId: string | null;
  ownerId: string;
}

// cash group
export interface ICashGroup {
  id: string;
  projectId: string;
  ownerId: string;
  name: string;
  groupType: GroupType;
  rankOrder: number;
  displayMode: DisplayMode;
}

export interface IGetCashGroup {
  groupId: string | null;
  projectId: string;
  ownerId: string;
}

export interface ICashGroupIdAndProjectId {
  cashGroupId: string;
  projectId: string;
}

export interface IUpsertCashGroup {
  name?: string;
  groupType?: GroupType;
  displayMode?: DisplayMode;
}

export interface IIdsAndUpsertCashGroup {
  projectId: string;
  orderType: OrderType;
  groupId: string;
  ownerId: string;
  upsertArgs: IUpsertCashGroup;
}

export interface IListGroupsByType {
  groupType: GroupType;
  projectId: string;
}

export interface ICheckIfGroupExists {
  projectId: string;
  ownerId: string;
  groupType: GroupType;
  name: string;
}

// cash entry row
export interface ICashEntryRow {
  id: string;
  projectId: string;
  ownerId: string;
  cashGroupId: string;
  name: string;
  rankOrder: number;
  displayMode: string;
}

export interface IGetCashEntryRow {
  projectId: string;
  ownerId: string;
  cashEntryRowId: string | null;
}

export interface IUpsertCashEntryRow {
  cashGroupId?: string;
  name?: string;
  displayMode?: DisplayMode;
}

export interface IIdsAndUpsertCashEntryRow {
  orderType: OrderType;
  cashEntryRowId: string;
  projectId: string;
  upsertArgs: IUpsertCashEntryRow;
}

export interface IArgsGetEntryRowInGroup {
  cashGroupId: string;
  projectId: string;
  ownerId: string;
}

export interface ICheckIfEntryRowExists {
  cashGroupId: string;
  projectId: string;
  ownerId: string;
  name: string;
}

// cash transaction
export interface ICashTransaction {
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
  parentId?: string | null;
}

export interface IListTransactionsInRow {
  projectId: string;
  ownerId: string;
  cashGroupId: string;
  cashEntryRowId: string;
}

export interface IGetCashTransaction {
  projectId: string;
  ownerId: string;
  cashTransactionId?: string;
}

export interface IUpsertCashTransaction {
  cashEntryRowId?: string;
  description?: string;
  transactionDate?: string;
  estimatedValue?: number;
  value?: number;
  frequency?: FrequencyType;
  frequencyStopAt?: string;
}

export interface IIdsAndUpsertCashTransaction {
  projectId: string;
  ownerId: string;
  transactions: [
    {
      cashTransactionId: string;
      upsertArgs: IUpsertCashTransaction;
    }
  ];
}

export interface IGetAllTransactionsInRowInDay {
  cashEntryRowId: string;
  transactionDate: string;
}

export interface ICashGroupFetchProject {
  id: string;
  name: string;
  groupType: GroupType;
  rankOrder: number;
  displayMode: DisplayMode;
  cashEntryRow?: [
    {
      id: string;
      projectId: string;
      ownerId: string;
      cashGroupId: string;
      name: string;
      rankOrder: number;
      displayMode: string;
      transactions?: [
        {
          transactionDate: string;
          totalValue: number;
          totalEstimatedValue: number;
          transactions?: [ICashTransaction];
        }
      ];
    }
  ];
}

// user
export interface IUser {
  id: string;
  googleId: string | null;
  email: string;
  password?: string | null;
  firstName: string;
  lastName: string;
  timezone: string;
  currency: string;
  isEmailVerified: boolean;
  activeSubscription: string | null;
  subscriptionExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  confirmationCode: string | null;
  customerId: string;
}

export interface IGetUserByEmail {
  email: string;
}

export interface IUserSignupArgs {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  customerId?: string;
  timezone: string;
  currency: string;
  token?: string;
}

export interface IUserLoginByGoogle {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone?: string;
  currency?: string;
}

export interface IUpdateUserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  currency?: string;
  isEmailVerified?: boolean;
  activeSubscription?: string | null;
  subscriptionExpiresAt?: Date | null;
  confirmationCode?: string | null;
}

export interface IUserPayload {
  userId: string;
  email: string;
}

export interface ILoginUserArgs {
  email: string;
  password: string;
}

export interface IResetPassword {
  token: string;
  password: string;
}

export interface IUpdatePasswordUser {
  currentPassword?: string;
  user: IUser;
  password: string;
}

export interface IUpdatePasswordArgs {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface IIdAndCode {
  id: string;
  confirmationCode: string;
}

export interface IUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  activeSubscription: string;
}

export interface IUpdateUserSubscription {
  customerId: string;
  subscription: string;
  expirationTime: number;
}

export interface IUserInfoContext {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  currency: string;
  activeSubscription: string;
  customerId: string;
}

export interface IContext {
  headers: any;
  expressRequest: any;
  token: string;
  userProjectIds: any;
  profile: IUserInfoContext;
  authorityWithProjects: [IAuthorityWithProjectIds];
}

export interface IConvertCurrency {
  ownerId: string;
  projectId: string;
  rate: number;
}

export interface IPlan {
  id: string;
  planId: string;
  name: string;
  recurring: Recurring;
  price: number;
  currency: string;
  description: string;
  discount: number;
}

export interface ISubscription {
  id: string;
  customerId: string;
  checkoutSessionId: string;
  stripeSubscriptionId: string;
  description: string;
  countInterval: number;
  status: string;
  startedAt: Date;
  canceledAt: Date | null;
}

export interface ISubArgs {
  customerId?: string;
  checkoutSessionId?: string;
  stripeSubscriptionId: string;
  description?: string;
  status?: string;
}

export interface ISharings {
  id?: string;
  projectId: string;
  userId: string;
  permission: Permission;
}

export interface IUserIdAndProjectId {
  projectId: string;
  authorizedUserId: string;
}

export interface IEmailAndProjectId {
  projectId: string;
  email: string;
}

export interface IIdAndEmail {
  id: string;
  email: string;
}

export interface IAuthorityWithProjectIds {
  projectId: string;
  permission: Permission;
}

export interface ISendInvitation {
  recipient: string;
  projectId: string;
  ownerId: string;
  permission: Permission;
}

export interface IInvitation {
  emails: [IIdAndEmail];
  projectId: string;
  permission: Permission;
}

export interface ICheckTheRight {
  currentUserId: string;
  projectId: string;
}

export interface ICheckUserCanHaveMoreProjects {
  ownerId: string;
  activeSubscription: string;
}
