import makeRequest from '../../utils/request';

it('mutation share project for some email', async () => {
  const query = /* GraphQL */ `
    mutation Invite($invitationArgs: InvitationInput) {
      invite(invitationArgs: $invitationArgs) {
        id
        email
      }
    }
  `;
  const result = await makeRequest({
    type: 'apollo',
    input: {
      query,
      payload: {
        invitationArgs: {
          projectId: '130',
          permission: 'VIEW',
          emails: [
            {
              id: '2222',
              email: 'chau@gmail.com'
            }
          ]
        }
      }
    }
  });
  expect(result.errors).toBeUndefined();
  expect(result.data.invite).toBe([]);
});
