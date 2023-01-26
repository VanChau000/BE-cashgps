export const plans = {
  STARTER: {
    activeSubscription: 'STARTER',
    projectsCount: 1,
    groupsPerTypeCount: 1,
    rowsPerGroupCount: 3,
    hasFeatureSharing: false,
    usersBeSharedCount: 0
  },
  BASIC: {
    activeSubscription: 'BASIC',
    projectsCount: 1,
    groupsPerTypeCount: 'unlimited',
    rowsPerGroupCount: 'unlimited',
    hasFeatureSharing: false,
    usersBeSharedCount: 0
  },
  MEDIUM: {
    activeSubscription: 'MEDIUM',
    projectsCount: 2,
    groupsPerTypeCount: 'unlimited',
    rowsPerGroupCount: 'unlimited',
    hasFeatureSharing: true,
    usersBeSharedCount: 5
  },
  PREMIUM: {
    activeSubscription: 'PREMIUM',
    projectsCount: 'unlimited',
    groupsPerTypeCount: 'unlimited',
    rowsPerGroupCount: 'unlimited',
    hasFeatureSharing: true,
    usersBeSharedCount: 'unlimited'
  },
  TRIAL: {
    activeSubscription: 'TRIAL',
    projectsCount: 'unlimited',
    groupsPerTypeCount: 'unlimited',
    rowsPerGroupCount: 'unlimited',
    hasFeatureSharing: true,
    usersBeSharedCount: 'unlimited'
  }
};
