import { STYLE_TYPE } from '../core/constants';
import { getValueAndItsUnit } from './element-options';

export function buildStylesFromClassesAndStyles(classes, styles) {
  // if focus add to base styles with psudo element tag
  Object.values(STYLE_TYPE).forEach((classType) => {
    if (classes[classType] || styles[classType]) {
      switch (classType) {
        case STYLE_TYPE.BASE:
          styles[classType] = {
            ...styles[classType],
          };
          break;
        case STYLE_TYPE.FOCUS:
          styles[STYLE_TYPE.BASE] = {
            ...styles[STYLE_TYPE.BASE],
            ':focus': {
              ...(styles[STYLE_TYPE.BASE] && styles[STYLE_TYPE.BASE][':focus']),
            },
          };
          break;
        case STYLE_TYPE.WEBPACKAUTOFILL:
          styles[STYLE_TYPE.BASE] = {
            ...styles[STYLE_TYPE.BASE],
            ':-webkit-autofill': {
              ...(styles[STYLE_TYPE.BASE]
                && styles[STYLE_TYPE.BASE][':-webkit-autofill']),
            },
          };
          break;
        default:
          styles[classType] = {
            ...styles[STYLE_TYPE.BASE],
            ...styles[classType],
          };
      }
    }
  });

  Object.keys(styles).forEach((styleType) => {
    const autofillStyles = styles[styleType][':-webkit-autofill'];
    if (typeof autofillStyles === 'object') {
      Object.keys(autofillStyles).forEach((styleKey) => {
        if (
          autofillStyles[styleKey]
          && !autofillStyles[styleKey].includes('!important')
        ) autofillStyles[styleKey] = `${autofillStyles[styleKey]} !important`;
      });
    }
  });
}

export const getFlexGridStyles = (obj: any) => {
  const spacingValueAndUnit = getValueAndItsUnit(obj.spacing);
  const styles = {
    'align-items': obj['align-items'] || 'stretch',
    'justify-content': obj['justify-content'] || 'flex-start',
    height:
      'auto'
      || `calc(100% + ${
        Number.parseInt(spacingValueAndUnit[0], 10) * 2 + spacingValueAndUnit[1]
      })`,
    width: `calc(100% + ${
      Number.parseInt(spacingValueAndUnit[0], 10) * 2 + spacingValueAndUnit[1]
    }))`,
    margin: `-${spacingValueAndUnit[0] + spacingValueAndUnit[1]}`,
    padding: '0px',
  };
  if (obj.padding) {
    styles.padding = getValueAndItsUnit(obj.padding).join('');
  }

  return styles;
};
