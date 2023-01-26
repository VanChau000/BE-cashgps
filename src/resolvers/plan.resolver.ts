import PlanService from '../services/plan.service';

const planResolvers = {
  /**
   * get plan
   * @param _
   * @param {planId}
   * @returns {plan}
   */
  getPlan: async (_: undefined, args: { id: string }) => {
    const paidPlan = await PlanService.getPlan(args.id);
    return paidPlan;
  },

  /**
   * get all plans
   * @param _
   * @param __
   * @returns {[plan]}
   */
  listPlans: async (_: undefined, __: undefined) => {
    const plans = await PlanService.listPlans();
    return plans;
  }
};

export default planResolvers;
