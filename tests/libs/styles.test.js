/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { buildStylesFromClassesAndStyles, getFlexGridStyles } from '../../src/libs/styles';

const styles = {
  base: {
    color: '#f44336',
  },
  focus: {
    color: 'blue',
  },
  '-webkit-autofill': {
    color: 'white'
  },
  default: {
    color: 'black',
  },
};
describe('construct styles', () => {
    
  it('buildStylesFromClassesAndStyles', () => {
    buildStylesFromClassesAndStyles({}, styles);
    expect(Object.keys(styles)).toContain('base')
  });

  it('getFlexGridStyles', () => {
    const styles = getFlexGridStyles({
        spacing: '2px',
        'align-items': 'center'
    });
    expect(styles['align-items']).toBe('center')
  });
});
