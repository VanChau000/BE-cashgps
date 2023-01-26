import makeRequest from '../utils/request';

describe('Position Resolvers', () => {
  let query, result;
  it('Upsert position: if positionId is null -> create new position', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertPositionArgs: UpsertCashPositionInput) {
        createOrUpdateCashPosition(upsertPositionArgs: $upsertPositionArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertPositionArgs: {
            projectId: '1',
            positionId: null,
            upsertArgs: {
              transactionDate: '2022-09-09',
              estimatedValue: 123400
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashPosition.result).toBe(
      'Position was inserted'
    );
  });

  it('Upsert position: Update position (id=1) to $123400 estimated value', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertPositionArgs: UpsertCashPositionInput) {
        createOrUpdateCashPosition(upsertPositionArgs: $upsertPositionArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertPositionArgs: {
            projectId: '1',
            positionId: '1',
            upsertArgs: {
              estimatedValue: 123400
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashPosition.result).toBe(
      'Position was updated'
    );
  });
});
