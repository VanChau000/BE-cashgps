export const trialPlan = {
  EXPIRATION_TIME: Date.now() + 14 * 24 * 3600 * 1000, // expires after 14 days
  ACTIVE_SUBSCRIPTION: 'TRIAL'
};

export const normalPlanForNewbie = {
  EXPIRATION_TIME: null,
  ACTIVE_SUBSCRIPTION: 'NORMAL'
};
