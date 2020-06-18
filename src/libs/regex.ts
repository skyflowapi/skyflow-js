export const regExFromString = function (regExString: string) {
  const lastSlash = regExString.lastIndexOf("/");
  return new RegExp(
    regExString.slice(1, lastSlash),
    regExString.slice(lastSlash + 1)
  );
};
