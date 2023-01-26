# Back-end
## Models
- CashProject
Give a context to a list of cash in and out. A company/client could have many projects/companies and would probably like to follow them distinctly without having to create many user accounts.
    + ownerId (the creator of the project)
    + name (the project name)
    + timezone (the owner's timezone)
    + currency (XXX i.e. USD, EUR, CAD, etc.)
    + initialCashFlow (initial cash flow of project at the start date - 1 day)
    + startDate (date to start following the cash flow - YYYY-MM-DD)
    + weekSchedule (use AND logic, i.e. 1 is Monday, 2 is Tuesday, 4 is Wednesday. so if Tuesday and Wednesday are selected, the value is 6 - 110 in base 2)
- CashPosition
    + projectId
    + ownerId (redundant but avoid doing a join with cashGroup)
    + transactionDate (YYYY-MM-DD, date recorded of the transaction)
    + estimatedValue
    + value (the real value)
- CashGroup (either a Cash In or Cash Out)
    + projectId
    + ownerId (redundant but avoid doing a join with project)
    + groupType (IN or OUT)
    + rankOrder (used in the UI to sort cash group from the user's preferences)
    + displayMode (USED or ARCHIVED)
- CashEntryRow
    + cashGroupId
    + projectId (redundant but avoid doing a join with cashGroup)
    + ownerId (redundant but avoid doing a join with cashGroup)
    + name (name of the row)
    + rankOrder (used in the UI to sort cash entry row from the user's preferences)
    + displayMode (USED or ARCHIVED)
- CashTransaction
    + cashEntryRowId
    + cashGroupId (redundant but avoid doing a join with cashEntryRow)
    + projectId (redundant but avoid doing a join with cashEntryRow)
    + ownerId (redundant but avoid doing a join with cashEntryRow)
    + displayMode (USED or ARCHIVED, inherited from cashEntryRow)
    + transactionDate (YYYY-MM-DD, date recorded of the transaction)
    + description (why the transaction exists)
    + estimatedValue
    + value (the real value)
- User
    + googleId (id sent by Google when using OAuth)
    + email
    + password (null if user is using OAuth)
    + fullname
    + isEmailVerified (default false, always true if provided by third party)
    + activeSubscription (default TRIAL otherwise subscription name or null if none active)
    + subscriptionExpiresAt (default created date + 14 days otherwise last day of the subscription cycle or null if expired)
## API
The API will mainly use GraphQL and in some specific cases Rest. The authentication will use JWT via the authorization HTTP header.
### Rest
All requests will be used as unauthenticated to provide offline support.
#### Endpoints
- /auth/google/callback - Called after a google login to create the user or redirect the user with a query code auth param
- /auth/google - Trigger a google login
- /auth/login - Exchange a pair of email/password for a JWT
- /auth/forgot/password - Send an email to reset the password (GET /forgotPassword -> /auth/forgot/password)
- /auth/reset/password - Exchange an old password + tmp token for a new password (check mail -> /auth/reset/password)
- /auth/signup - create an user from email/password/fullname and send an email
- /auth/signup/confirm - confirm a new confirm by checking his email
### GraphQL
All requests must be authenticated via the JWT token or will be rejected with a 403. Fields unset must be submitted as null.
#### Query
- fetchProject: return a project with its cash groups and values related (cash entry row, cash entry, etc.)
- fetchSubscriptions: return the list of possible subscriptions
#### Mutation
- createOrUpdateCashProject: create or update a cash project (name + timezone + currency + startDate + weekSchedule)
- createOrUpdateCashPosition: create or update a cash position (estimatedValue + value + transactionDate)
- createOrUpdateCashGroup: create or update a cash group (name + cash group type + rankOrder + displayMode)
- createOrUpdateCashEntryRow: create or update a cash entry row (name + cash group id + rankOrder + displayMode)
- createOrUpdateCashEntry: create or update a list of cash transactions (estimatedValue + value + cashEntryRowId + description + transactionDate + frequency + frequencyStopAt)
- updateUser: update an user (fullname)
- updateUserSubscription: update the user subscription (cancel or set a new one)
## Caching
Redis will be use as cache-memory store (data which won't change a lot but heavy to fetch like Stripe data)
## Tests
Basic unit test will be provided for each resolver


+ cash position estimated: user put data or auto computes
user put data
+ how far from estimated to actual? What for it?
user input first estimated then actual when he knows the real value. Then we will compare the difference = actual / estimated
+ daily table => should not include week totals
correct
+ stripe subscription for what? Why we don't link directly to bank account
stripe subscription to use the app, it's a monthly fee.
+ rank order: what type to sort
Sort the rows. User wants to re-arrange the rows from his own preference.
+ new item: what item in database
what do you mean?
+ weekSchedule in cash project model
weekSchedule gives which week day that the user wants to use in his project (Monday, Tuesday etc.).
+ Type of weekSchedule is a number (only one week) => so what happens if one year we have 52 weeks.
it's not related to a week number, it's just giving the days we use for the project (explain in my previous answer above).
+ how to process timezOne in cash project model
timezone isn't specific to cash project. Hanoi is in +7 UTC, please read about it.
+ daily table => in dateTransaction should include time of transaction
we don't care about the time, only the day matter for accounting.
+ do we have a feature for print the table
not now
+ do this project have one owner and many users? (So how many max for user can access to the app and are they have access right)
for now one user = one project but later we could allow co-owners.