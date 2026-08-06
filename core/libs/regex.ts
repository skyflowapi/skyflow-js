/*
Copyright (c) 2022 Skyflow, Inc.
*/
const regExFromString = (regExString: string) => {
  const lastSlash = regExString.lastIndexOf('/');
  return new RegExp(
    regExString.slice(1, lastSlash),
    regExString.slice(lastSlash + 1),
  );
};

export default regExFromString;
