import makeRequest from '../../utils/request';

describe('fectProject of current user', () => {
  let query, result;
  it('get project of current user', async () => {
    query = /* GraphQL */ `
      query FetchProject($projectId: String) {
        fetchProject(projectId: $projectId) {
          ownerActiveSubscription
          ownerSubscriptionExpiresAt
          cashGroup {
            cashEntryRow {
              cashGroupId
              displayMode
              id
              name
              ownerId
              projectId
              rankOrder
              transactions {
                transactionDate
                transactions {
                  cashEntryRowId
                  cashGroupId
                  description
                  displayMode
                  estimatedValue
                  frequency
                  frequencyStopAt
                  id
                  ownerId
                  projectId
                  transactionDate
                  value
                }
              }
            }
            displayMode
            groupType
            id
            name
            rankOrder
          }
          infoProject {
            currency
            currencySymbol
            initialCashFlow
            projectName
            startDate
            startingBalance
            timezone
            weekSchedule
          }
          permission
        }
      }
    `;

    result = await makeRequest({
      type: 'apollo',
      input: {
        query,
        payload: {
          projectId: '130'
        }
      }
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.fetchProject.infoProject.projectName).toEqual('asd');
  });
});
