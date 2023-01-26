import { KnexSubscription } from 'knex/types/tables';
import clients from '../clients';
import { ISubArgs, ISubscription } from '../types/interfaces';

declare module 'knex/types/tables' {
  interface KnexSubscription {
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

  interface Tables {
    subscriptions: KnexSubscription;
  }
}

export function serializeSubscription(sub: KnexSubscription): ISubscription {
  return {
    id: sub.id,
    customerId: sub.customerId,
    checkoutSessionId: sub.checkoutSessionId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    description: sub.description,
    countInterval: sub.countInterval,
    status: sub.status,
    startedAt: sub.startedAt,
    canceledAt: sub.canceledAt
  };
}

const knexClient = clients.knex.getInstance();

export default class SubscriptionModel {
  /**
   * get Subscription Id By Customer Id
   * @param customerId
   * @returns {string}
   */
  static getSubscriptionIdByCustomerId = async (customerId: string) => {
    const [{ stripeSubscriptionId }] = (
      await knexClient('subscriptions').where({ customerId })
    ).map(serializeSubscription);

    return stripeSubscriptionId;
  };

  /**
   * insert subscription record
   * @param subArgs @ISubArgs
   * @returns {string}
   */
  static insertSubscription = async ({
    checkoutSessionId,
    customerId,
    description,
    stripeSubscriptionId,
    status
  }: ISubArgs) => {
    await knexClient('subscriptions').insert({
      customerId,
      checkoutSessionId,
      stripeSubscriptionId,
      description,
      status,
      countInterval: 0,
      startedAt: new Date()
    });
    return 'Subscription has been created successfully!';
  };

  /**
   * create sub
   * @param subArgs
   * @returns
   */
  static updateStatusSubscription = async (subArgs: ISubArgs) => {
    const { status, stripeSubscriptionId } = subArgs;

    // update numbers of subscription's interval
    if (status === 'complete')
      await knexClient('subscriptions')
        .where({ stripeSubscriptionId })
        .increment('countInterval', 1);

    // update status after payment
    await knexClient('subscriptions')
      .where({ stripeSubscriptionId })
      .update({ status });

    return 'Subscription has been renewed successfully!';
  };

  /**
   * cancel the subscription
   * @param customerId
   */
  static cancelSubscription = async (stripeSubscriptionId: string) => {
    await knexClient('subscriptions').where({ stripeSubscriptionId }).update({
      canceledAt: new Date()
    });
  };
}
