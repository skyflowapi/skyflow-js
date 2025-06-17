/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  CollectContainer,
  CollectElement,
  CollectElementInput,
  ErrorTextStyles,
  SkyflowConfig,
  InputStyles,
  ValidationRule,
  LabelStyles,
} from 'skyflow-js';

try{
    const config: SkyflowConfig = {
      vaultID: '<VAULT_ID>',
      vaultURL: '<VAULT_URL>',
      getBearerToken: () => {
        return new Promise((resolve, reject) => {
          const Http = new XMLHttpRequest();

          Http.onreadystatechange = () => {
            if (Http.readyState === 4 && Http.status === 200) {
              const response = JSON.parse(Http.responseText);
              resolve(response.accessToken);
            }
          };
          const url = '<TOKEN_END_POINT_URL>';
          Http.open('GET', url);
          Http.send();
        });
      },
      options:{
        logLevel:Skyflow.LogLevel.ERROR,
        env:Skyflow.Env.PROD,
      }
    }
    const skyflowClient: Skyflow = Skyflow.init(config);

      // Create collect Container.
    const collectContainer = skyflowClient.container(Skyflow.ContainerType.COLLECT) as CollectContainer;

    // Custom styles for collect elements.
    const collectStylesOptions = {
      inputStyles: {
        base: {
          border: '1px solid #eae8ee',
          padding: '10px 16px',
          borderRadius: '4px',
          color: '#1d1d1d',
          marginTop: '4px',
        },
        complete: {
          color: '#4caf50',
        },
        empty: {},
        focus: {},
        invalid: {
          color: '#f44336',
        },
      } as InputStyles,
      labelStyles: {
        base: {
          fontSize: '16px',
          fontWeight: 'bold',
        },
      } as LabelStyles,
      errorTextStyles: {
        base: {
          color: '#f44336',
        },
      } as ErrorTextStyles,
    };

      // Create a validation rule.
    const regexRule: ValidationRule = {
      // REGEX Rule will validate the element value with the given regex
      type:Skyflow.ValidationRuleType.REGEX_MATCH_RULE ,
      params:{
          // regex rule expects a regex to be tested on element value
          regex:/[A-Za-z0-9]+/,
          // specify what error text should be displayed 
          // when this validation rule failed
          error:'only alphabets are allowed'
      }
    }
    // Creating a length rule.
    const lengthRule: ValidationRule = {
      // LENGTH match rule will validate whether the element value length matches with given length.  
      type:Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
      params:{
          // specify minimum length that element value should have
          min:3,
          // specify maximum length that element value should have
          max:12,
          // specify what error text should be displayed 
          // when this validation rule failed
          error:'must be between 3 to 12 alphabets'
      }
    }
      
    const userNameInput: CollectElementInput = {
      table: 'pii_fields',
      column: 'first_name',
      ...collectStylesOptions,
      placeholder: 'Enter User Name',
      label: 'User Name',
      type: Skyflow.ElementType.INPUT_FIELD,
      // pass validation rules
      validations:[regexRule,lengthRule]
    }
    const userNameElement: CollectElement = collectContainer.create(userNameInput);

    const passwordInput: CollectElementInput = {
      ...collectStylesOptions,
      label: 'Enter Password',
      placeholder: 'Password',
      type: Skyflow.ElementType.INPUT_FIELD,
    }
    const passwordElement: CollectElement = collectContainer.create(passwordInput);

    const elementMatchRule: ValidationRule = {
      // ELEMENT VALUE MATCH RULE validates that element value matches the provied element.
	    type: Skyflow.ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
	    params: {
        // Specify with which element value should be matched.
        element: passwordElement,
        // Specify what error text should be displayed 
        // when this validation rule failed
        error: 'password doesn’t match'
	    }
    }

    const confirmPasswordInput: CollectElementInput = {
      ...collectStylesOptions,
      label: 'Confirm Password',
      placeholder: 'confirm password',
      type: Skyflow.ElementType.INPUT_FIELD,
      // Add validations.
      validations:[elementMatchRule]
    }
    const confirmPasswordElement: CollectElement = collectContainer.create(confirmPasswordInput);

    // Mount the elements.
    userNameElement.mount('#collectUserName');
    passwordElement.mount('#collectPassword');
    confirmPasswordElement.mount('#collectConfirmPassword');

} catch (err: unknown) {
    console.log(err);
}