import makeRequest from '../../utils/request';

it('get information of owner project', async () => {
  const query = /* GraphQL */ `
    query ListInfoOfAuthorizedUsersWithProject($projectId: String) {
      listInfoOfAuthorizedUsersWithProject(projectId: $projectId) {
        userId
        lastName
        firstName
        email
        permission
      }
    }
  `;

  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        projectId: '130'
      }
    }
  });
  expect(result.errors).toBeUndefined;
  expect(result.data.listInfoOfAuthorizedUsersWithProject).toBe([]);
});
