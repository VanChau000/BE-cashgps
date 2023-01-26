import { KnexPlan } from 'knex/types/tables';
import clients from '../clients';
import { Recurring } from '../constants/enumType';
import { IPlan } from '../types/interfaces';

declare module 'knex/types/tables' {
  interface KnexPlan {
    id: string;
    planId: string;
    name: string;
    recurring: Recurring;
    price: number;
    currency: string;
    description: string;
    discount: number;
  }

  interface Tables {
    plans: KnexPlan;
  }
}

export function serializePlan(paidPlan: KnexPlan): IPlan {
  return {
    id: paidPlan.id,
    planId: paidPlan.planId,
    name: paidPlan.name,
    recurring: paidPlan.recurring,
    price: paidPlan.price,
    currency: paidPlan.currency,
    description: paidPlan.description,
    discount: paidPlan.discount
  };
}

const knexClient = clients.knex.getInstance();

export default class PlanModel {
  /**
   * get plan by id
   * @param id
   * @returns {IPlan}
   */
  static getPlan = async (id: string) => {
    const [paidPlan] = (await knexClient('plans').where('id', id)).map(
      serializePlan
    );
    return paidPlan;
  };

  /**
   * get all plans
   * @returns {[IPlan]}
   */
  static listPlans = async () => {
    const plans = (await knexClient('plans').select('*')).map(serializePlan);
    return plans;
  };
}
