import makeRequest from '../utils/request';

describe('CashEntryRow Resolvers', () => {
  let query, result;
  it('Upsert entry row: if cashEntryRowId is null -> create new row', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertEntryRowArgs: UpsertCashEntryRowInput) {
        createOrUpdateCashEntryRow(upsertEntryRowArgs: $upsertEntryRowArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertEntryRowArgs: {
            cashEntryRowId: null,
            projectId: '1',
            upsertArgs: {
              cashGroupId: '1',
              name: 'Learn on Kevin',
              displayMode: 'USED'
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashEntryRow.result).toBe(
      'Entry row was inserted'
    );
  });

  it('Upsert entry row: Update entry row (id=8) new name', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertEntryRowArgs: UpsertCashEntryRowInput) {
        createOrUpdateCashEntryRow(upsertEntryRowArgs: $upsertEntryRowArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertEntryRowArgs: {
            cashEntryRowId: '13',
            projectId: '1',
            upsertArgs: {
              cashGroupId: '1',
              name: 'Knowledge'
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashEntryRow.result).toBe(
      'Entry row was updated'
    );
  });

  it('List all entry rows in a group', async () => {
    query = /* GraphQL */ `
      mutation Mutation($listEntryRowInGroupArgs: ListEntryRowInGroupInput) {
        listEntryRowsInGroup(
          listEntryRowInGroupArgs: $listEntryRowInGroupArgs
        ) {
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
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          listEntryRowInGroupArgs: {
            cashGroupId: '104'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.listEntryRowsInGroup[0]).toBe({
      id: '198',
      projectId: '20',
      ownerId: '104',
      cashGroupId: '104',
      name: 'English',
      rankOrder: 1,
      displayMode: 'USED'
    });
  });

  it('Delete cash entry row', async () => {
    query = /* GraphQL */ `
      mutation Mutation($deleteRowArgs: DeleteCashEntryRowInput) {
        deleteCashEntryRow(deleteRowArgs: $deleteRowArgs) {
          messageOfDeletion
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          deleteRowArgs: {
            id: '198'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.deleteCashEntryRow.messageOfDeletion).toBe(
      'Entry row was removed'
    );
  });
});
