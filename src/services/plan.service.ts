import PlanModel from '../models/plan.model';

export default class PlanService {
  /**
   * get plan
   * @param id
   * @returns {plan}
   */
  static getPlan = async (id: string) => {
    const paidPlan = await PlanModel.getPlan(id);
    return paidPlan;
  };

  /**
   * get all plans
   * @returns {[plan]}
   */
  static listPlans = async () => {
    const plans = await PlanModel.listPlans();
    return plans;
  };
}
