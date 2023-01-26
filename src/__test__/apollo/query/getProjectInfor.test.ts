import makeRequest from '../../utils/request';

it('get list project of a user', async () => {
  const query = /* GraphQL */ `
    query GetProjectInfo($projectId: String) {
      getProjectInfo(projectId: $projectId) {
        id
        ownerId
        name
        startingBalance
        timezone
        currency
        initialCashFlow
        startDate
        weekSchedule
      }
    }
  `;

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        projectId: '130'
      }
    }
  });
  expect(result.errors).toBeUndefined;
  expect(result.data.getProjectInfo.name).toBe('asd');
});
