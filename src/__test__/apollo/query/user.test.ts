import makeRequest from '../../utils/request';

describe('User Query', () => {
  let query, result;
  it('get information of current user', async () => {
    query = /* GraphQL */ `
      query GetUser {
        getUser {
          id
          email
          googleId
          lastName
          firstName
          timezone
          currency
          isEmailVerified
          activeSubscription
          subscriptionExpiresAt
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query
      }
    });
    expect(result.errors).toBeUndefined;
    expect(result.data.getUser.id).toBe('1');
  });
});
