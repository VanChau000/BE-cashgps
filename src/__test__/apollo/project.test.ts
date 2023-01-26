import makeRequest from '../utils/request';

describe('Project Resolvers', () => {
  let query, result;
  it('fetch project', async () => {
    query = /* GraphQL */ `
      query Query($argsFetchProject: FetchProjectInput) {
        fetchProject(argsFetchProject: $argsFetchProject) {
          projectName
          startingBalance
          timezone
          currency
          initialCashFlow
          startDate
          weekSchedule
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          argsFetchProject: {
            projectId: '1'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.fetchProject.projectName).toEqual('Cash bussiness');
  });

  it('Upsert project: if id is null -> create new project', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertProjectArgs: UpsertCashProjectInput) {
        createOrUpdateCashProject(upsertProjectArgs: $upsertProjectArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertProjectArgs: {
            projectId: null,
            upsertArgs: {
              name: 'Test project',
              startingBalance: 1000,
              timezone: '+0 UTC',
              currency: 'USD',
              startDate: '2022-12-12',
              weekSchedule: 127
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashProject.result).toBe(
      'Project was inserted'
    );
  });

  it('Upsert project: Update project (id=1) to $9999 balance', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertProjectArgs: UpsertCashProjectInput) {
        createOrUpdateCashProject(upsertProjectArgs: $upsertProjectArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertProjectArgs: {
            projectId: '1',
            upsertArgs: {
              startingBalance: 9999
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashProject.result).toBe(
      'Project was updated'
    );
  });
});
