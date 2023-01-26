import makeRequest from '../utils/request';

describe('Cash group Resolvers', () => {
  let query, result;
  it('Upsert group: if groupId is null -> create new group', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertGroupArgs: UpsertCashGroupInput) {
        createOrUpdateCashGroup(upsertGroupArgs: $upsertGroupArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertGroupArgs: {
            projectId: '1',
            groupId: null,
            upsertArgs: {
              name: 'Cash in team Mar A',
              groupType: 'IN',
              displayMode: 'USED'
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashGroup.result).toBe(
      'Group was inserted'
    );
  });

  it('Upsert cash group: Update cash group (id=1) new name', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertGroupArgs: UpsertCashGroupInput) {
        createOrUpdateCashGroup(upsertGroupArgs: $upsertGroupArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertGroupArgs: {
            projectId: '1',
            groupId: '1',
            upsertArgs: {
              name: 'Cash in team Mar A'
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashGroup.result).toBe(
      'Group was updated'
    );
  });

  it('List groups: get all groups a project', async () => {
    query = /* GraphQL */ `
      query Query {
        listGroups {
          filteredGroups {
            in {
              id
              name
            }
            out {
              id
              name
            }
          }
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: { query }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.listGroups.filteredGroups).toBe({
      in: [
        {
          id: '126',
          name: 'sfsdf'
        }
      ],
      out: [
        {
          id: '127',
          name: 'dd'
        }
      ]
    });
  });

  it('List groups by type: get all filtered IN-OUT groups in a project', async () => {
    query = /* GraphQL */ `
      query Query($groupType: String) {
        listGroupsByType(groupType: $groupType) {
          groupsByType {
            id
            name
          }
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          groupType: 'OUT'
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.listGroupsByType.groupsByType).toBe([
      {
        id: '127',
        name: 'Payroll'
      }
    ]);
  });

  it('List entry rows in group of project', async () => {
    query = /* GraphQL */ `
      query Query($listEntryRowInGroupArgs: ListEntryRowInGroupInput) {
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
            cashGroupId: '23'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.listGroupsByType.groupsByType).toBe([]);
  });

  it('Delete cash group', async () => {
    query = /* GraphQL */ `
      mutation Mutation($deleteGroupArgs: DeleteCashGroupInput) {
        deleteCashGroup(deleteGroupArgs: $deleteGroupArgs) {
          messageOfDeletion
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          deleteGroupArgs: {
            id: '104'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.deleteCashGroup.messageOfDeletion).toBe(
      'Cash group was removed'
    );
  });
});
