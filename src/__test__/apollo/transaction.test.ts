import makeRequest from '../utils/request';

describe('Transaction Resolvers', () => {
  let query, result;
  it('Upsert transaction: if transactionId is null -> create new transaction', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertTransactionArgs: UpsertCashTransactionInput) {
        createOrUpdateCashEntry(upsertTransactionArgs: $upsertTransactionArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertTransactionArgs: {
            cashTransactionId: null,
            projectId: '1',
            cashGroupId: '1',
            upsertArgs: {
              cashEntryRowId: '1',
              description: 'go shopping with mama',
              transactionDate: '2022-09-10',
              estimatedValue: 23300,
              frequency: 'MONTHLY',
              value: 23000,
              frequencyStopAt: '2024-01-01'
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashEntry.result).toBe(
      'Transaction was inserted'
    );
  });

  it('Upsert transaction: Update transaction (id=1) new description', async () => {
    query = /* GraphQL */ `
      mutation Mutation($upsertTransactionArgs: UpsertCashTransactionInput) {
        createOrUpdateCashEntry(upsertTransactionArgs: $upsertTransactionArgs) {
          result
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          upsertTransactionArgs: {
            cashTransactionId: '1',
            projectId: '1',
            cashGroupId: '1',
            upsertArgs: {
              description: 'go fishing'
            }
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.createOrUpdateCashEntry.result).toBe(
      'Transaction was updated'
    );
  });

  it('List all transactions a day in a row', async () => {
    query = /* GraphQL */ `
      query Query(
        $getAllTransactionsInRowInDay: GetAllTransactionsInRowInDayArgs
      ) {
        listTransactionsInRowInDay(
          getAllTransactionsInRowInDay: $getAllTransactionsInRowInDay
        ) {
          id
          cashEntryRowId
          cashGroupId
          projectId
          ownerId
          displayMode
          transactionDate
          description
          estimatedValue
          value
          frequency
          frequencyStopAt
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          getAllTransactionsInRowInDay: {
            cashEntryRowId: '1',
            transactionDate: '2022-09-10'
          }
        }
      }
    });
    console.log(result.data);
    expect(result.errors).toBeUndefined();
    expect(
      result.data.listTransactionsInRowInDay.length
    ).toBeGreaterThanOrEqual(0);
  });

  it('Delete cash transaction', async () => {
    query = /* GraphQL */ `
      mutation Mutation($deleteTransactionArgs: DeleteCashTransactionInput) {
        deleteCashTransaction(deleteTransactionArgs: $deleteTransactionArgs) {
          messageOfDeletion
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          deleteTransactionArgs: {
            id: 'a5ea134b-4525-41bd-bbfd-021df5341fb9'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.deleteCashTransaction.messageOfDeletion).toBe(
      'Cash transaction was removed'
    );
  });
});
