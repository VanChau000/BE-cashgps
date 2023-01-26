import makeRequest from '../../utils/request';

it('get list entry row', async () => {
  const query = /* GraphQL */ `
    query ListEntryRowsInGroup(
      $listEntryRowInGroupArgs: ListEntryRowInGroupInput
    ) {
      listEntryRowsInGroup(listEntryRowInGroupArgs: $listEntryRowInGroupArgs) {
        id
        projectId
        ownerId
        cashGroupId
        name
        rankOrder
        displayMode
      }
    }
  `;

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        listEntryRowInGroupArgs: {
          projectId: '130',
          cashGroupId: '483'
        }
      }
    }
  });
  expect(result.errors).toBeUndefined;
  expect(result.data.listEntryRowsInGroup).toBe([]);
});
