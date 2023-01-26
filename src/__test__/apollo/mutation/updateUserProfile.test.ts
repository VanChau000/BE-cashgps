import makeRequest from '../../utils/request';

it('update user profile', async () => {
  const query = /* GraphQL */ `
    mutation UpdateUserProfile(
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
  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        firstName: 'chau',
        lastName: 'nguyen van',
        timezone: 'UTC-10:00',
        currency: 'VND'
      }
    }
  });
  const finalRsult = result.data.updateUserProfile;
  expect(result.errors).toBeUndefined();
  expect(finalRsult).toBe({
    id: '266',
    email: 'duc@nelisoftwares.com',
    firstName: 'chau',
    lastName: 'nguyen van',
    timezone: 'UTC-10:00',
    currency: 'VND',
    activeSubscription: 'TRIAL',
    subscriptionExpiresAt: '1673241044596'
  });
});
