import makeRequest from '../utils/request';

describe('User Resolvers', () => {
  let query, result;
  it('get current user', async () => {
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

  it('update profile user', async () => {
    query = /* GraphQL */ `
      mutation Mutation(
        $firstName: String
        $lastName: String
        $timezone: String
        $currency: String
      ) {
        updateUserProfile(
          firstName: $firstName
          lastName: $lastName
          timezone: $timezone
          currency: $currency
        ) {
          id
          email
          firstName
          lastName
          timezone
          currency
          activeSubscription
          subscriptionExpiresAt
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          currency: 'CAD'
        }
      }
    });
    expect(result.errors).toBeUndefined;
    expect(result.data.updateUserProfile.currency).toBe('CAD');
  });

  it('change user password', async () => {
    query = /* GraphQL */ `
      mutation Mutation($updatePasswordArgs: UpdatePasswordInput) {
        changePassword(updatePasswordArgs: $updatePasswordArgs) {
          message
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          updatePasswordArgs: {
            currentPassword: 'duc123456',
            newPassword: 'duc12345',
            newPasswordConfirm: 'duc12345'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.changePassword.message).toBe(
      'Change password successfully'
    );
  });
});
