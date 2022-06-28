/*
Copyright (c) 2022 Skyflow, Inc.
*/
import jss from 'jss';
import preset from 'jss-preset-default';

jss.setup(preset());

export default function getCssClassesFromJss(styles, name) {
  const createGenerateId = () => (rule) => `SkyflowElement-${name}-${rule.key}`;
  jss.setup({ createGenerateId });
  const cssStyle = jss.createStyleSheet(styles);
  return cssStyle.attach().classes;
}
