export const mask = function (value = "", prevValue = "", maskObject, focus) {
  const pattern = maskObject[0];
  const replacer = maskObject[1];
  const patternRegexMapper = maskObject[2];
  const patternRegexMapperKeys = Object.keys(patternRegexMapper);
  let newValue = value;

  if (prevValue === value) {
    const unmaskValue = unMask(value, maskObject);
    if (!focus && unmaskValue.length === 0) return "";
  }

  if (newValue.length === 0) {
    newValue = pattern;
    patternRegexMapperKeys.forEach((char) => {
      newValue.replace(new RegExp(char, "g"), replacer !== null ? replacer : "");
    });
  }

  let i = 0;
  let backspaceIndex;
  if (prevValue.length !== 0 && newValue.length === prevValue.length - 1) {
    // backspace = prevValue.slice(-1);
    for (let idx = 0, prvIdx = 0; prvIdx < prevValue.length; idx++, prvIdx++) {
      if (newValue[idx] !== prevValue[prvIdx]) {
        if (idx !== undefined) {
          backspaceIndex = idx;
          idx--;
        } else {
          backspaceIndex = undefined;
          break;
        }
      }
    }
  }

  if (backspaceIndex) {
    let removerIndex = backspaceIndex;
    if (!patternRegexMapperKeys.includes(pattern[backspaceIndex])) {
      for (let idx = backspaceIndex - 1; idx >= 0; idx--) {
        if (patternRegexMapperKeys.includes(pattern[idx])) {
          removerIndex = idx;
          break;
        }
      }
      if (removerIndex !== backspaceIndex) {
        newValue = newValue.slice(0, removerIndex) + newValue.slice(backspaceIndex);
      }
    }
  }

  for (i = 0; i < pattern.length; i++) {
    if (newValue[i] === undefined) {
      if (!patternRegexMapperKeys.includes(pattern[i])) {
        if (replacer) {
          newValue = splice(newValue, i, 0, replacer);
        } else {
          newValue = splice(newValue, i, 0, pattern[i]);
          continue;
        }
      }

      if (patternRegexMapperKeys.includes(pattern[i])) {
        if (!replacer) {
          break;
        } else {
          newValue = splice(newValue, i, 0, replacer);
        }
      }
    } else {
      if (pattern[i] === newValue[i] && !patternRegexMapperKeys.includes(pattern[i])) {
        continue;
      }

      if (patternRegexMapperKeys.includes(pattern[i])) {
        if (
          !patternRegexMapper[pattern[i]].test(newValue[i]) ||
          newValue[i] === replacer
        ) {
          newValue = replaceAt(newValue, i, "");
          i--;
        }
      } else {
        newValue = splice(newValue, i, 0, pattern[i]);
      }
    }
  }

  if (newValue.length >= pattern.length) {
    newValue = newValue.slice(0, pattern.length);
  }

  return newValue;
};

export const unMask = function (value = "", maskObject) {
  const pattern = maskObject[0];
  const replacer = maskObject[1];
  const patternRegexMapper = maskObject[2];
  const patternRegexMapperKeys = Object.keys(patternRegexMapper);
  let newValue = "";
  let lastReplacerIndex = 0;
  for (let i = 0; i < value.length; i++) {
    if (patternRegexMapperKeys.includes(pattern[i])) {
      if (replacer && value[i] !== replacer) {
        lastReplacerIndex = newValue.length;
      }
      newValue += value[i];
    }
  }

  return newValue.slice(0, replacer ? lastReplacerIndex : newValue.length);
};

export const splice = function (
  string: string,
  index: number,
  removeCount: number,
  adder: string
) {
  return string.slice(0, index) + adder + string.slice(index + Math.abs(removeCount));
};

export const replaceAt = function (str: string, index: number, replacer: string = "") {
  return (str = str.substring(0, index) + replacer + str.substring(index + 1));
};
