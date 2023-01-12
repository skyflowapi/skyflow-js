import ComposableElement from '../../../../src/core/external/collect/compose-collect-element';
import { ContainerType } from '../../../../src/skyflow';

describe('test composable element',()=>{
    const testEventEmitter = {
        on:(name,cb)=>{
          if(name.includes('FOCUS')){
            cb({
              isValid: true,
              isComplete: true,
              name:'element',
              value:undefined
          })
          }else{
            cb({
              isValid: true,
              isComplete: true,
              name:'element',
              value:''
          })
          }
         
        }
    }
    const handler = jest.fn();
    const testElement = new ComposableElement('testce1',testEventEmitter);

    it('test valid listner - 2 ',()=>{
        expect(testElement.type).toBe(ContainerType.COMPOSABLE);
        testElement.on('CHANGE',handler);
        expect(handler).toBeCalledWith({value:'',isValid:true})
    });

    it('test valid listiner 1',()=>{
      expect(testElement.type).toBe(ContainerType.COMPOSABLE);
      testElement.on('FOCUS',handler);
      expect(handler).toBeCalledWith({value:'',isValid:true})
  });

    it('invalid on listener - 1', () => {
        try {
            testElement.on('invalid_listener', (state) => {
          });
        } catch (err) {
          expect(err).toBeDefined();
        }
      });
      it('invalid on listener - 2', () => {
        try {
            testElement.on('CHANGE', null);
        } catch (err) {
          
        }
      });
      it('invalid on listener - 3', () => {
        try {
            testElement.on('CHANGE',true);
        } catch (err) {
          expect(err).toBeDefined();
        }
      });
    
});