import Skyflow from "skyflow-js";

try{
    const skyflow = Skyflow.init({
        vaultID: "<VAULT_ID>",
        vaultURL: "<VAULT_URL>",
        getBearerToken: () => {
          return new Promise((resolve, reject) => {
            const Http = new XMLHttpRequest();

            Http.onreadystatechange = () => {
              if (Http.readyState === 4 && Http.status === 200) {
                const response = JSON.parse(Http.responseText);
                resolve(response.accessToken);
              }
            };
            const url = "<TOKEN_END_POINT_URL>";
            Http.open("GET", url);
            Http.send();
          });
        },
        options:{
          logLevel:Skyflow.LogLevel.ERROR,
          env:Skyflow.Env.PROD,
        }
      });

      // create collect Container
      const collectContainer = skyflow.container(Skyflow.ContainerType.COLLECT);

      //custom styles for collect elements
      const collectStylesOptions = {
        inputStyles: {
          base: {
            border: "1px solid #eae8ee",
            padding: "10px 16px",
            borderRadius: "4px",
            color: "#1d1d1d",
            marginTop: "4px",
          },
          complete: {
            color: "#4caf50",
          },
          empty: {},
          focus: {},
          invalid: {
            color: "#f44336",
          },
        },
        labelStyles: {
          base: {
            fontSize: "16px",
            fontWeight: "bold",
          },
        },
        errorTextStyles: {
          base: {
            color: "#f44336",
          },
        },
      };


      // create a validation rule
      const regexRule = {
        // REGEX Rule will validate the element value with the given regex
        type:Skyflow.ValidationRuleType.REGEX_RULE ,
        params:{
            // regex rule expects a regex to be tested on element value
            regex:/[A-Za-z0-9]+/,
            // specify what error text should be displayed 
            // when this validation rule failed
            error:"only alphabets are allowed"
        }
      }
      // creating a length rule
      const lengthRule = {
        // LENGTH match rule will validate whether the element value length matches with given length.  
        type:Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
        params:{
            // specify minimum length that element value should have
            min:3,
            // specify maximum length that element value should have
            max:12,
            // specify what error text should be displayed 
            // when this validation rule failed
            error:"must be between 3 to 12 alphabets"
        }
      }
      
      const userNameElement = collectContainer.create({
        table: "pii_fields",
        column: "first_name",
        ...collectStylesOptions,
        placeholder: "Enter User Name",
        label: "User Name",
        type: Skyflow.ElementType.INPUT_FIELD,
        // pass validation rules
        validations:[regexRule,lengthRule]
      });

      const passwordElement = collectContainer.create({
        ...collectStylesOptions,
        label: "Enter Password",
        placeholder: "Password",
        type: Skyflow.ElementType.INPUT_FIELD,
      });

    const elementMatchRule = {
      // ELEMENT VALUE MATCH RULE validates that element value matches the provied element.
	    type: Skyflow.ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
	    params: {
            // specify with which element value should be matched.
	        element: passwordElement,
            // specify what error text should be displayed 
            // when this validation rule failed
            error: "password doesn’t match"
	    }
    }

      const confirmPasswordElement = collectContainer.create({
        ...collectStylesOptions,
        label: "Confirm Password",
        placeholder: "confirm password",
        type: Skyflow.ElementType.INPUT_FIELD,
        // add validations
        validations:[elementMatchRule]
      });


      // mount the elements
      userNameElement.mount("#collectUserName");
      passwordElement.mount("#collectPassword");
      confirmPasswordElement.mount("#collectConfirmPassword");

}catch(err){
    console.log(err);
}