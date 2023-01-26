import makeRequest from '../../utils/request';

it('get list transactions of one row in a day', async () => {
  const query = /* GraphQL */ `
    query ListTransactionsInRowInDay(
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

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        getAllTransactionsInRowInDay: {
          transactionDate: '2022-12-27',
          cashEntryRowId: '621'
        }
      }
    }
  });
  const arrResult = result.data.listTransactionsInRowInDay;
  expect(result.errors).toBeUndefined;
  expect(result.data.listTransactionsInRowInDay).toBe(
    [] || arrResult.length > 0
  );
});
