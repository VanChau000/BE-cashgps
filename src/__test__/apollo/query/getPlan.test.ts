import makeRequest from '../../utils/request';

it('get all plan of subscription', async () => {
  const query = /* GraphQL */ `
    query ListPlans {
      listPlans {
        id
        planId
        name
        recurring
        price
        currency
        description
        discount
      }
    }
  `;

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {}
    }
  });
  expect(result.errors).toBeUndefined;
  expect(result.data.listPlans).toBe([]);
});
