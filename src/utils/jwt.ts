import jwt from 'jsonwebtoken';

export function isValidToken(token: string): boolean {
  try {
    const decoded = jwt.decode(token, { complete: true });

    return !!decoded;
  } catch (error) {
    console.log(error);
    return false;
  }
}
