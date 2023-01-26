import makeRequest from '../../utils/request';

it('get list project of a user', async () => {
  const query = /* GraphQL */ `
    query ListProjects {
      listProjects {
        ownerActiveSubscription
        ownerSubscriptionExpiresAt
        projects {
          id
          ownerId
          name
          startingBalance
          timezone
          currency
          initialCashFlow
          startDate
          weekSchedule
          ownerEmail
          ownerLastName
          ownerFirstName
          sharedWith {
            userId
            lastName
            firstName
            email
            permission
          }
        }
        sharingProjects {
          id
          ownerId
          name
          startingBalance
          timezone
          currency
          initialCashFlow
          startDate
          weekSchedule
          permission
          ownerEmail
          ownerLastName
          ownerFirstName
        }
      }
    }
  `;

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query
    }
  });
  expect(result.errors).toBeUndefined;
  expect(result.data.listProjects.projects).toBe([]);
});
