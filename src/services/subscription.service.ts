import SubscriptionModel from '../models/subscription.model';
import { ISubArgs } from '../types/interfaces';

export default class SubscriptionService {
  static getSubscriptionIdByCustomerId = async (customerId: string) =>
    await SubscriptionModel.getSubscriptionIdByCustomerId(customerId);

  /**
   * insert Subscription
   * @param @ISubArgs
   * @returns {string}
   */
  static insertSubscription = async ({
    checkoutSessionId,
    customerId,
    description,
    stripeSubscriptionId,
    status
  }: ISubArgs) => {
    // get result after registering subscription
    const registrationResult = await SubscriptionModel.insertSubscription({
      customerId,
      description,
      checkoutSessionId,
      stripeSubscriptionId,
      status
    });

    return { registrationResult };
  };

  /**
   * update Subscription
   * @param @ISubArgs
   * @returns {string}
   */
  static updateSubscription = async ({
    customerId,
    description,
    status,
    checkoutSessionId,
    stripeSubscriptionId
  }: ISubArgs) => {
    // the result of subsctiprion update
    const registrationResult = await SubscriptionModel.insertSubscription({
      customerId,
      description,
      status,
      checkoutSessionId,
      stripeSubscriptionId
    });

    return { registrationResult };
  };

  /**
   * update Status Subscription
   * @param @ISubArgs
   * @returns {string}
   */
  static updateStatusSubscription = async ({
    stripeSubscriptionId,
    status
  }: ISubArgs) => {
    // the result of status subscription update
    const updateResult = await SubscriptionModel.updateStatusSubscription({
      status,
      stripeSubscriptionId
    });

    return { updateResult };
  };

  /**
   * cancel Subscription
   * @param {checkoutSessionId, stripeSubscriptionId}
   * @returns {string}
   */
  static cancelSubscription = async (stripeSubscriptionId: string) => {
    await SubscriptionModel.cancelSubscription(stripeSubscriptionId);
  };
}
