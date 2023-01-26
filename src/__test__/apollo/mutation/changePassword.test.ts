import makeRequest from '../../utils/request';

describe('CashEntryRow Resolvers', () => {
  let query, result;
  it('Delete cash entry row', async () => {
    query = /* GraphQL */ `
      mutation ChangePassword($updatePasswordArgs: UpdatePasswordInput) {
        changePassword(updatePasswordArgs: $updatePasswordArgs) {
          message
        }
      }
    `;
    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          updatePasswordArgs: {
            newPasswordConfirm: '232323',
            newPassword: 'Test0101',
            currentPassword: 'Test0101'
          }
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.changePassword.message).toBe(
      'Change password successfully'
    );
  });
});
