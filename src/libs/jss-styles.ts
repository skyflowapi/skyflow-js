import jss from "jss";
import preset from "jss-preset-default";
jss.setup(preset());

export function getCssClassesFromJss(styles, name) {
  const createGenerateId = () => {
    return (rule, sheet) => `SkyflowElement-${name}-${rule.key}`;
  };
  jss.setup({ createGenerateId });
  const cssStyle = jss.createStyleSheet(styles);
  return cssStyle.attach().classes;
}
