import makeRequest from '../../utils/request';

it('mutation list all entry row in cash group', async () => {
  const query = /* GraphQL */ `
    mutation ListEntryRowsInGroup(
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
  expect(result.errors).toBeUndefined();
  expect(result.data.listEntryRowsInGroup).toBe([
    {
      id: '621',
      projectId: '130',
      ownerId: '266',
      cashGroupId: '483',
      name: 'test',
      rankOrder: 1,
      displayMode: 'USED'
    }
  ]);
});
