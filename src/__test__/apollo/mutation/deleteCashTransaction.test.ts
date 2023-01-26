import makeRequest from '../../utils/request';

it('mutation delete cash transaction', async () => {
  const query = /* GraphQL */ `
    mutation DeleteCashTransaction(
      $deleteTransactionArgs: DeleteCashTransactionInput
    ) {
      deleteCashTransaction(deleteTransactionArgs: $deleteTransactionArgs) {
        messageOfDeletion
      }
    }
  `;
  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        deleteTransactionArgs: {
          projectId: '130',
          id: '65605aeb-9b49-4847-b6f5-7afbb1ee3dd6'
        }
      }
    }
  });
  expect(result.errors).toBeUndefined();
  expect(result.data.deleteCashTransaction.messageOfDeletion).toBe(
    'Cash transaction was removed'
  );
});
