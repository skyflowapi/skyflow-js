import ThreeDS from '../../../../src/core/external/threeds/threeds';
import SkyflowError from '../../../../src/libs/skyflow-error';

describe('test 3DS helperFunction', ()=>{
    let originalCreateElement;
  
    beforeAll(() => {
        // Save the original document.createElement
        originalCreateElement = document.createElement;
    });
    beforeEach(()=>{
      jest.spyOn(document, "createElement").mockImplementation((element)=>{
        switch (element){
          case  "iframe":
          const iFrame = originalCreateElement.call(document,"iframe")
          iFrame.sandbox = {add:(...tokens)=>{}}
          return iFrame
          default:
            const ele = originalCreateElement.call(document,element)
            return ele
        }
      })
    })
    afterEach(()=>{
      jest.clearAllMocks
    })
    test('test 3DS getBrowserDetails function', () => {
      const browserDetails = ThreeDS.getBroswerDetails()
      expect(browserDetails).toBeDefined()
      expect(browserDetails.browser_accept_header).toEqual("application/json")
      expect(browserDetails.browser_color_depth).toEqual("24")
      expect(browserDetails.browser_screen_height).toEqual(0)
      expect(browserDetails.browser_screen_width).toEqual(0)
      expect(browserDetails.browser_user_agent).toEqual("Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/16.7.0")
      expect(browserDetails.browser_java_enabled).toEqual(false)
      expect(browserDetails.browser_language).toEqual("en-US")
      expect(browserDetails.browser_tz).toEqual((new Date()).getTimezoneOffset())
      expect(browserDetails.browser_javascript_enabled).toEqual(true)
    });
  
    test('test 3DS showChallenge function: success', ()=>{
      const challengeIFrame = ThreeDS.showChallenege("acsUrl","cReq",'01',document.body)
      expect(challengeIFrame).toBeDefined()
    })
  
    test('test 3DS showChallenge function: success with optional fields', ()=>{
      const challengeIFrame = ThreeDS.showChallenege("acsUrl","cReq")
      expect(challengeIFrame).toBeDefined()
    })
  
    test('test 3DS showChallenge function: success with different challengeWindowSizes', ()=>{
      const challengeIFrame = ThreeDS.showChallenege("acsUrl","cReq",'02',document.body)
      expect(challengeIFrame).toBeDefined()
  
      const challengeIFrame2 = ThreeDS.showChallenege("acsUrl","cReq",'03',document.body)
      expect(challengeIFrame2).toBeDefined()
  
      const challengeIFrame3 = ThreeDS.showChallenege("acsUrl","cReq",'04',document.body)
      expect(challengeIFrame3).toBeDefined()
  
      const challengeIFrame4 = ThreeDS.showChallenege("acsUrl","cReq",'05',document.body)
      expect(challengeIFrame4).toBeDefined()
    })
  
    test('test 3DS showChallenge function: acsUrl Error', ()=>{
      try{
        const challengeIFrame = ThreeDS.showChallenege("","cReq",'01',document.body)
      }catch(err){
        expect(err).toBeDefined()
        expect(err instanceof SkyflowError).toBeTruthy()
        let errMessage;
        if (err instanceof SkyflowError){
          errMessage = err.message
        }
        expect(errMessage).toEqual('Invalid field \'acsUrl\'. Cannot initiate 3DS Challenge. Verify \'acsUrl\'')
      }
    })
  
    test('test 3DS showChallenge function: cReq Error', ()=>{
      try{
        const challengeIFrame = ThreeDS.showChallenege("acsUrl","",'01',document.body)
      }catch(err){
        expect(err).toBeDefined()
        expect(err instanceof SkyflowError).toBeTruthy()
        let errMessage;
        if (err instanceof SkyflowError){
          errMessage = err.message
        }
        expect(errMessage).toEqual('Invalid field \'cReq\'. Cannot initiate 3DS Challenge. Verify \'cReq\'')
      }
    })
  
    test('test 3DS showChallenge function: challengeWindowSize Error', ()=>{
      try{
        const challengeIFrame = ThreeDS.showChallenege("acsUrl","cReq",'abcd',document.body)
      }catch(err){
        expect(err).toBeDefined()
        expect(err instanceof SkyflowError).toBeTruthy()
        let errMessage;
        if (err instanceof SkyflowError){
          errMessage = err.message
        }
        expect(errMessage).toEqual('Invalid field \'challengeWindowSize\'. Cannot initiate 3DS Challenge. Verify \'challengeWindowSize\'')
      }
    })
  
    test('test 3DS showChallenge function: container Error', ()=>{
      try{
        const challengeIFrame = ThreeDS.showChallenege("acsUrl","cReq",'01','abcd')
      }catch(err){
        expect(err).toBeDefined()
        expect(err instanceof SkyflowError).toBeTruthy()
        let errMessage;
        if (err instanceof SkyflowError){
          errMessage = err.message
        }
        expect(errMessage).toEqual('Invalid field \'container\'. Cannot initiate 3DS Challenge. Verify \'container\'')
      }
    })
  })
  