
import { ALLOWED_STYLES, STYLE_TYPE } from "../container/constants";
import { getValueAndItsUnit } from "./element-options";

export function getStylesFromClass(cssClass) {
  return undefined;
  if (!cssClass) return {};
  var element = document.createElement("input");
  var styles = {};
  var computedStyles;

  if (cssClass[0] === ".") {
    cssClass = cssClass.substring(1);
  }

  element.className = cssClass;
  element.style.display = "none !important";
  element.style.position = "fixed !important";
  element.style.left = "-99999px !important";
  element.style.top = "-99999px !important";
  document.body.appendChild(element);

  computedStyles = window.getComputedStyle(element);

  ALLOWED_STYLES.forEach(function (style) {
    var value = computedStyles[style];

    if (value) {
      styles[style] = value;
    }
  });

  document.body.removeChild(element);

  return styles;
}

export function splitStyles(styles) {
  const pseudoStyles = {};
  const nonPseudoStyles = {};
  for (const style in styles) {
    if (style && style[0] === ":") {
      pseudoStyles[style] = styles[style];
    } else {
      nonPseudoStyles[style] = styles[style];
    }
  }

  return [nonPseudoStyles, pseudoStyles];
}

export function buildStylesFromClassesAndStyles(classes, styles) {
  // if focus add to base styles with psudo element tag
  Object.values(STYLE_TYPE).forEach((classType) => {
    if (classes[classType] || styles[classType])
      switch (classType) {
        case STYLE_TYPE.BASE:
          styles[classType] = {
            ...getStylesFromClass(classes[classType]),
            ...styles[classType],
          };
          break;
        case STYLE_TYPE.FOCUS:
          styles[STYLE_TYPE.BASE] = {
            ...styles[STYLE_TYPE.BASE],
            ":focus": {
              ...getStylesFromClass(classes[classType]),
              ...(styles[STYLE_TYPE.BASE] && styles[STYLE_TYPE.BASE][":focus"]),
            },
          };
          break;
        case STYLE_TYPE.WEBPACKAUTOFILL:
          styles[STYLE_TYPE.BASE] = {
            ...styles[STYLE_TYPE.BASE],
            ":-webkit-autofill": {
              ...getStylesFromClass(classes[classType]),
              ...(styles[STYLE_TYPE.BASE] &&
                styles[STYLE_TYPE.BASE][":-webkit-autofill"]),
            },
          };
          break;
        default:
          styles[classType] = {
            ...styles[STYLE_TYPE.BASE],
            ...getStylesFromClass(classes[classType]),
            ...styles[classType],
          };
      }
  });

  Object.keys(styles).forEach((styleType) => {
    const autofillStyles = styles[styleType][":-webkit-autofill"];
    if (typeof autofillStyles === "object") {
      Object.keys(autofillStyles).forEach((styleKey) => {
        if (
          autofillStyles[styleKey] &&
          !autofillStyles[styleKey].includes("!important")
        )
          autofillStyles[styleKey] = autofillStyles[styleKey] + " !important";
      });
    }
  });
}

export const getFlexGridStyles = (obj: any) => {
  const spacingValueAndUnit = getValueAndItsUnit(obj.spacing);
  const styles = {
    "align-items": obj["align-items"] || "stretch",
    "justify-content": obj["justify-content"] || "flex-start",
    height:
      "auto" ||
      `calc(100% + ${
        Number.parseInt(spacingValueAndUnit[0]) * 2 + spacingValueAndUnit[1]
      })`,
    width: `calc(100% + ${
      Number.parseInt(spacingValueAndUnit[0]) * 2 + spacingValueAndUnit[1]
    }))`,
    margin: `-${spacingValueAndUnit[0] + spacingValueAndUnit[1]}`,
    padding: "0px",
  };
  if (obj.padding) {
    styles.padding = getValueAndItsUnit(obj.padding).join("");
  }

  return styles;
};
