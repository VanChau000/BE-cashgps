import makeRequest from '../../utils/request';

it('get list group by type In or Out', async () => {
  const query = /* GraphQL */ `
    query ListGroupsByType($listGroupsByType: ListGroupsByTypeInput) {
      listGroupsByType(listGroupsByType: $listGroupsByType) {
        groupsByType {
          id
          name
        }
      }
    }
  `;

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        listGroupsByType: {
          projectId: '130',
          groupType: 'IN'
        }
      }
    }
  });
  expect(result.errors).toBeUndefined;
  expect(result.data.listGroupsByType.groupsByType).toBe([]);
});
