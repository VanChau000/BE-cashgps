import makeRequest from '../../utils/request';

it('mutation delete cash project', async () => {
  const query = /* GraphQL */ `
    mutation DeleteCashProject($projectId: String) {
      deleteCashProject(projectId: $projectId) {
        messageOfDeletion
      }
    }
  `;
  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        projectId: '145'
      }
    }
  });
  expect(result.errors).toBeUndefined();
  expect(result.data.deleteCashProject.messageOfDeletion).toBe(
    'Cash project has been removed!'
  );
});
