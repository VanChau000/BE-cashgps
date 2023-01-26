import { IUser } from '../../types/interfaces';
import makeRequest from '../utils/request';
import { deleteUser, seedUser } from '../utils/seed/user';

describe('Auth Route', () => {
  it('signup', async () => {
    const resultSignUp = await makeRequest({
      type: 'express',
      input: {
        payload: {
          route: 'auth/signup',
          body: { email: 'duc@nelisoftwares.com', password: 'minhduc123' }
        }
      }
    });
    console.log(resultSignUp);
  });

  it('login', async () => {
    const resultLogin = await makeRequest({
      type: 'express',
      input: {
        payload: {
          route: 'auth/login',
          body: { email: 'duc@nelisoftwares.com', password: 'minhduc123' }
        }
      }
    });
    console.log(resultLogin);
  });
});
