/*
Copyright (c) 2022 Skyflow, Inc.
*/
import jwt_decode, { JwtPayload } from 'jwt-decode';

const isString = (x) => Object.prototype.toString.call(x) === '[object String]';

const isTokenValid = (token: string) => {
  try {
    if (!token) {
      return false;
    }
    if (!isString(token)) {
      return false;
    }
    let isJwtExpired = false;
    const decoded: JwtPayload = jwt_decode(token);
    const currentTime = new Date().getTime() / 1000;
    const expiryTime = decoded.exp;

    if (expiryTime && currentTime > expiryTime) {
      isJwtExpired = true;
    }

    return !isJwtExpired;
  } catch (err) {
    return false;
  }
};

export default isTokenValid;
