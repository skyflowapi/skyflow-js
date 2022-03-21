import jwt_decode, { JwtPayload } from 'jwt-decode';

const isString = (x) => Object.prototype.toString.call(x) === '[object String]';

const isTokenValid = (token: string) => {
  if (!token) {
    return false;
  }
  if (!isString(token)) {
    return false;
  }
  let isJwtExpired = false;
  const decoded: JwtPayload = jwt_decode(token);
  let currentTime = new Date().getTime() / 1000;
  currentTime -= 300;
  const expiryTime = decoded.exp;

  if (expiryTime && currentTime > expiryTime) {
    isJwtExpired = true;
  }

  return !isJwtExpired;
};

export default isTokenValid;
