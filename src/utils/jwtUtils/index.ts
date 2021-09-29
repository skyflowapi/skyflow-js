import jwt_decode, { JwtPayload } from 'jwt-decode';

const isTokenValid = (token: string) => {
  let isJwtExpired = false;
  const decoded: JwtPayload = jwt_decode(token);
  const currentTime = new Date().getTime() / 1000;
  const expiryTime = decoded.exp;

  if (expiryTime && currentTime > expiryTime) {
    isJwtExpired = true;
  }

  return !isJwtExpired;
};

export default isTokenValid;
