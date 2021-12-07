# skyflow-js
Skyflow’s Javascript SDK can be used to securely collect, tokenize, and reveal sensitive data in the browser without exposing your front-end infrastructure to sensitive data. 

---

# Table of Contents
- [**Including Skyflow.js**](#Including-Skyflowjs) 
- [**Initializing Skyflow.js**](#Initializing-Skyflowjs)
- [**Securely collecting data client-side**](#Securely-collecting-data-client-side)
- [**Securely revealing data client-side**](#Securely-revealing-data-client-side)
- [**Securely invoking Connections client-side**](#Securely-invoking-Connections-client-side)

---

# Including Skyflow.js
Using script tag

```html
<script src="https://js.skyflow.com/v1/index.js"></script>
```


Using npm

```
npm install skyflow-js
```

---

# Initializing Skyflow.js
Use the `init()` method to initialize a Skyflow client as shown below. 
```javascript
import Skyflow from "skyflow-js" // If using script tag, this line is not required

const skyflowClient = Skyflow.init({
   vaultID: "string",          //Id of the vault that the client should connect to 
   vaultURL: "string",         //URL of the vault that the client should connect to
   getBearerToken: helperFunc,  //helper function that retrieves a Skyflow bearer token from your backend
   options:{
     logLevel: Skyflow.LogLevel, // optional, if not specified default is ERROR 
     env: Skyflow.Env          // optional, if not specified default is PROD 
   }
})
```
For the `getBearerToken` parameter, pass in a helper function that retrieves a Skyflow bearer token from your backend. This function will be invoked when the SDK needs to insert or retrieve data from the vault. A sample implementation is shown below: 

For example, if the response of the consumer tokenAPI is in the below format

```
{
   "accessToken": string,
   "tokenType": string
}

```
then, your getBearerToken Implementation should be as below

```javascript
getBearerToken: () => {
  return new Promise((resolve, reject) => {
    const Http = new XMLHttpRequest();

    Http.onreadystatechange = () => {
      if (Http.readyState == 4) {
        if (Http.status == 200) {
          const response = JSON.parse(Http.responseText);
          resolve(response.accessToken);
        } else {
          reject("Error occured");
        }
      }
    };

    Http.onerror = (error) => {
      reject("Error occured");
    };

    const url = "https://api.acmecorp.com/skyflowToken";
    Http.open("GET", url);
    Http.send();
  })

}

```
For `logLevel` parameter, there are 4 accepted values in Skyflow.LogLevel

- `DEBUG`
    
  When `Skyflow.LogLevel.DEBUG` is passed, all level of logs will be printed(DEBUG, INFO, WARN, ERROR).

- `INFO`

  When `Skyflow.LogLevel.INFO` is passed, INFO logs for every event that has occurred during the SDK flow execution will be printed along with WARN and ERROR logs.


- `WARN`

  When `Skyflow.LogLevel.WARN` is passed, WARN and ERROR logs will be printed.

- `ERROR`

  When `Skyflow.LogLevel.ERROR` is passed, only ERROR logs will be printed.

`Note`:
  - The ranking of logging levels is as follows :  DEBUG < INFO < WARN < ERROR
  - since `logLevel` is optional, by default the logLevel will be  `ERROR`.



For `env` parameter, there are 2 accepted values in Skyflow.Env

- `PROD`
- `DEV`

  In [Event Listeners](#event-listener-on-collect-elements), actual value of element can only be accessed inside the handler when the `env` is set to `DEV`.

`Note`:
  - since `env` is optional, by default the env will be  `PROD`.
  - Use `env` option with caution, make sure the env is set to `PROD` when using `skyflow-js` in production. 

---

# Securely collecting data client-side
-  [**Inserting data into the vault**](#inserting-data-into-the-vault)
-  [**Using Skyflow Elements to collect data**](#using-skyflow-elements-to-collect-data)
-  [**Using validations on Collect Elements**](#validations)
-  [**Event Listener on Collect Elements**](#event-listener-on-collect-elements)
-  [**UI Error for Collect Eements**](#ui-error-for-collect-elements)
- [**Set and Clear value for Collect Elements (DEV ENV ONLY)**](#set-and-clear-value-for-collect-elements-dev-env-only)
## Inserting data into the vault

To insert data into the vault from the browser, use the `insert(records, options?)` method of the Skyflow client. The `records` parameter takes a JSON object of the records to be inserted in the below format. The `options` parameter takes a dictionary of optional parameters for the insertion. See below: 

```javascript
const records = {
  "records": [
  	{
      table: "string", //table into which record should be inserted
      fields: {
        column1: "value", //column names should match vault column names
        //...additional fields here
      }
    }
    //...additional records here
  ]
}

const options = {
  tokens: true  //indicates whether or not tokens should be returned for the inserted data. Defaults to 'true'  
}

skyflowClient.insert(records, options={})
```

 

An example of an insert call: 
```javascript
skyflowClient.insert({
  "records": [
  {
    "table": "cards",
    "fields": {
      "cardNumber": "41111111111",
      "cvv": "123",
    }
  }]
});
```

The sample response:
```javascript
{
  "records": [
    {
     "table": "cards",
     "fields":{
        "cardNumber": "f3907186-e7e2-466f-91e5-48e12c2bcbc1",
        "cvv": "1989cb56-63da-4482-a2df-1f74cd0dd1a5"
      }
    }
  ]
}
```

## Using Skyflow Elements to collect data

**Skyflow Elements** provide developers with pre-built form elements to securely collect sensitive data client-side. These elements are hosted by Skyflow and injected into your web page as iframes. This reduces your PCI compliance scope by not exposing your front-end application to sensitive data. Follow the steps below to securely collect data with Skyflow Elements on your web page. 

### Step 1: Create a container

First create a container for the form elements using the `container(Skyflow.ContainerType)` method of the Skyflow client as show below:

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)
```

### Step 2: Create a collect Element

A Skyflow collect Element is defined as shown below: 

```javascript
const collectElement =  {
   table: "string",             //optional, the table this data belongs to
   column: "string",            //optional, the column into which this data should be inserted
   type: Skyflow.ElementType,   //Skyflow.ElementType enum
   inputStyles: {},             //optional styles that should be applied to the form element
   labelStyles: {},             //optional styles that will be applied to the label of the collect element
   errorTextStyles:{},          //optional styles that will be applied to the errorText of the collect element
   label: "string",             //optional label for the form element
   placeholder: "string",       //optional placeholder for the form element
   altText: "string"            //(DEPRECATED) string that acts as an initial value for the collect element
   validations:[]               // optional array of validation rules
}
```
The `table` and `column` fields indicate which table and column in the vault the Element corresponds to. 

**Note**: 
-  Use dot delimited strings to specify columns nested inside JSON fields (e.g. `address.street.line1`)
-  `table` and `column` are optional only if the element is being used in invokeConnection()

The `inputStyles` field accepts a style object which consists of CSS properties that should be applied to the form element in the following states:
- `base`: all other variants inherit from these styles
- `complete`: applied when the Element has valid input
- `empty`: applied when the Element has no input
- `focus`: applied when the Element has focus
- `invalid`: applied when the Element has invalid input

Styles are specified with [JSS](https://cssinjs.org/?v=v10.7.1). 

An example of a inputStyles object:
```javascript
inputStyles:{
    base: {
      border: "1px solid #eae8ee",
      padding: "10px 16px",
      borderRadius: "4px",
      color: "#1d1d1d",
    },
    complete: {
      color: "#4caf50",
    },
    empty: {},
    focus: {},
    invalid: {
      color: "#f44336",
    },
  }
}
```
The states that are available for `labelStyles` are `base` and `focus`.

An example of a labelStyles object:

```javascript
labelStyles: {
    base: {
      fontSize: "12px",
      fontWeight: "bold"
    },
    focus: {
      color: "#1d1d1d"
    }
}
```

The state that is available for `errorTextStyles` is only the `base` state, it shows up when there is some error in the collect element.

An example of a errorTextStyles object:

```javascript
errorTextStyles: {
    base: {
      color: "#f44336"
    }
}
```

Finally, the `type` field takes a Skyflow ElementType. Each type applies the appropriate regex and validations to the form element. There are currently 5 types:
- `CARDHOLDER_NAME`
- `CARD_NUMBER`
- `EXPIRATION_DATE`
- `CVV`
- `INPUT_FIELD`
- `PIN`

The `INPUT_FIELD` type is a custom UI element without any built-in validations.  See the section on [validations](#validations) for more information on validations.

Along with CollectElement we can define other options which takes a dictionary of optional parameters as described below:

```javascript
const options = {
  required: false,  //optional, indicates whether the field is marked as required. Defaults to 'false'
  enableCardIcon: true // optional, indicates whether card icon should be enabled (only applicable for CARD_NUMBER ElementType)
  format: String //optinal, format for the element (only applicable currently for EXPIRATION_DATE ElementType)
}
```

`required` parameter indicates whether the field is marked as required or not. If not provided, it defaults to false

`enableCardIcon` paramenter indicates whether the icon is visible for the CARD_NUMBER element, defaults to true

`format` parameter takes string value and indicates the format pattern applicable to the element type. It is currently applicable to EXPIRATION_DATE element type only, the values that are accepted are

- `MM/YY`
- `MM/YYYY`
- `YY/MM`
- `YYYY/MM`

`NOTE` : If not specified or invalid value is passed to the format for EXPIRATION_DATE element, then it defaults to MM/YY format.


Once the Element object and options has been defined, add it to the container using the `create(element, options)` method as shown below. The `element` param takes a Skyflow Element object and options as defined above:

```javascript
const collectElement =  {
   table: "string",             //the table this data belongs to
   column: "string",            //the column into which this data should be inserted
   type: Skyflow.ElementType,   //Skyflow.ElementType enum
   inputStyles: {},             //optional styles that should be applied to the form element
   labelStyles: {},             //optional styles that will be applied to the label of the collect element
   errorTextStyles:{},          //optional styles that will be applied to the errorText of the collect element
   label: "string",             //optional label for the form element
   placeholder: "string",       //optional placeholder for the form element
   altText: "string"            //(DEPRECATED) string that acts as an initial value for the collect element
   validations:[]               // optional array of validation rules
}

const options = {
  required: false,  //optional, indicates whether the field is marked as required. Defaults to 'false'
  enableCardIcon: true // optional, indicates whether card icon should be enabled (only applicable for CARD_NUMBER ElementType)
  format: String //optinal, format for the element (only applicable currently for EXPIRATION_DATE ElementType)
}

const element = container.create(collectElement, options)
```

### Step 3: Mount Elements to the DOM

To specify where the Elements will be rendered on your page, create placeholder `<div>` elements with unique `id` tags. For instance, the form below has 4 empty divs with unique ids as placeholders for 4 Skyflow Elements. 

```html
<form>
  <div id="cardNumber"/>
  <br/>
  <div id="expireDate"/>
  <br/> 
  <div id="cvv"/>
  <br/>
  <div id="pin"/>
  <button type="submit">Submit</button>
</form>
```

Now, when the `mount(domElement)` method of the Element is called, the Element will be inserted in the specified div. For instance, the call below will insert the Element into the div with the id "#cardNumber".  

```javascript
element.mount("#cardNumber")
```
you can use the `unmount` method to reset any collect element to it's initial state.
```javascript
element.unmount();
```

### Step 4: Collect data from Elements

When the form is ready to be submitted, call the `collect(options?)` method on the container object. The `options` parameter takes a dictionary of optional parameters as shown below: 

- `tokens`: indicates whether tokens for the collected data should be returned or not. Defaults to 'true'
- `additionalFields`: Non-PCI elements data to be inserted into the vault which should be in the `records` object format as described in the above [Inserting data into vault](#inserting-data-into-the-vault) section.

```javascript
const options = {
  tokens: true  //optional, indicates whether tokens for the collected data should be returned. Defaults to 'true'
  additionalFields: {  
    records: [
      {
        table: "string", //table into which record should be inserted
        fields: {
          column1: "value", //column names should match vault column names
          //...additional fields here
        }
      }
      //...additional records here
    ]
  } //optional
}

container.collect(options={})
```

### End to end example of collecting data with Skyflow Elements

**Sample Code:**

```javascript
//Step 1
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT) 

//Step 2
const element = container.create({           
  table: "cards",
  column: "cardNumber",
  inputstyles: {
      base: {
        color: "#1d1d1d",
      },
  },
  labelStyles: {
      base: {
        fontSize: "12px",
        fontWeight: "bold"
      }
  },
  errorTextStyles: {
      base: {
        color: "#f44336"
      }
  },
  placeholder: "Card Number",
  label: "card_number",
  type: Skyflow.ElementType.CARD_NUMBER
})

// Step 3
element.mount("#cardNumber")  //assumes there is a div with id="#cardNumber" in the webpage

// Step 4

const nonPCIRecords = {
    "records": [
      {
        "table": "cards",
        "fields": {
          "gender": "MALE"
        }
      }
    ]
  }

container.collect({
  tokens: true,
  additionalFields: nonPCIRecords
})
```

**Sample Response :**
```javascript
{
  "records": [
    {
      "table": "cards",
      "fields": {
        "cardNumber": "f3907186-e7e2-466f-91e5-48e12c2bcbc1",
        "gender": "12f670af-6c7d-4837-83fb-30365fbc0b1e"
      }
    }
  ]
}
```

### Validations

Skyflow-JS provides two types of validations on Collect Elements

#### 1. Default Validations:
Every Collect Element except of type `INPUT_FIELD` has a set of default validations listed below:
- `CARD_NUMBER`: Card number validation with checkSum algorithm(Luhn algorithm), available card lengths for defined card types
- `CARD_HOLDER_NAME`: Name should be 2 or more symbols, valid characters should match pattern -  `^([a-zA-Z\\ \\,\\.\\-\\']{2,})$`
- `CVV`: Card CVV can have 3-4 digits
- `EXPIRATION_DATE`: Any date starting from current month. By default valid expiration date should be in short year format - `MM/YY`
- `PIN`: Can have 4-12 digits

#### 2. Custom Validations:
Custom validations can be added to any element which will be checked after the default validations have passed. The following Custom validation rules are currently supported:
- `REGEX_MATCH_RULE`: You can use this rule to specify any Regular Expression to be matched with the input field value

```javascript
const regexMatchRule = {
  type: Skyflow.ValidationRuleType.REGEX_MATCH_RULE,
  params: {
    regex: RegExp,
    error: string // optional, default error is "VALIDATION FAILED"
  }
}
```

- `LENGTH_MATCH_RULE`: You can use this rule to set the minimum and maximum permissible length of the input field value

```javascript
const lengthMatchRule = {
  type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
  params: {
    min : number, // optional
    max : number, // optional 
    error: string // optional, default error is "VALIDATION FAILED"
  }
}
```

- `ELEMENT_VALUE_MATCH_RULE`: You can use this rule to match the value of one element with another element

```javascript
const elementValueMatchRule = {
  type: Skyflow.ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
  params: {
    element: CollectElement,
    error: string // optional, default error is "VALIDATION FAILED"
  }
}
```

The Sample code snippet for using custom validations:

```javascript
/*
  A simple example that illustrates custom validations.
  Adding REGEX_MATCH_RULE , LENGTH_MATCH_RULE to collect element.
*/

// this rule allows 1 or more alphabets
const alphabetsOnlyRegexRule = {
  type: Skyflow.ValidationRuleType.REGEX_MATCH_RULE,
  params:{
    regex: /^[A-Za-z]+$/,
    error: "Only alphabets are allowed"
  }
}; 

// this rule allows input length between 4 and 6 characters
const lengthRule = {
  type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
  params:{
    min: 4,
    max: 6,
    error: "Must be between 4 and 6 alphabets"
  }
}; 

 const cardHolderNameElement = collectContainer.create({
      table: "pii_fields",
      column: "first_name",
      ...collectStylesOptions,
      label: "Card Holder Name",
      placeholder: "cardholder name",
      type: Skyflow.ElementType.INPUT_FIELD,
      validations: [alphabetsOnlyRegexRule, lengthRule]
    });

/*
  Reset PIN - A simple example that illustrates custom validations.
  The below code shows an example of ELEMENT_VALUE_MATCH_RULE
*/

// for the PIN element
const pinElement = collectContainer.create({
  label: "PIN",
  placeholder: "****",
  type: Skyflow.ElementType.PIN,
});

// this rule allows to match the value with pinElement
let elementMatchRule = {
  type: Skyflow.ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
  params:{
    element: pinElement,
    error: "PIN doesn't match"
  }
}
const confirmPinElement = collectContainer.create({
  label: "Confirm PIN",
  placeholder: "****",
  type: Skyflow.ElementType.PIN,
  validations: [elementMatchRule]
});

// mount elements on screen - errors will be shown if any of the validaitons fail
pinElement.mount("#collectPIN");
confirmPinElement.mount("#collectConfirmPIN");

```
### Event Listener on Collect Elements


Helps to communicate with skyflow elements / iframes by listening to an event

```javascript
element.on(Skyflow.EventName,handler:function)
```

There are 4 events in `Skyflow.EventName`
- `CHANGE`  
  Change event is triggered when the Element's value changes.

- `READY`   
   Ready event is triggered when the Element is fully rendered

- `FOCUS`   
 Focus event is triggered when the Element gains focus

- `BLUR`    
  Blur event is triggered when the Element loses focus.

The handler ```function(state) => void```   is a callback function you provide, that will be called when the event is fired with the state object as shown below. 

```javascript
state : {
  elementType: Skyflow.ElementType
  isEmpty: boolean 
  isFocused: boolean
  isValid: boolean
  value: string
}
```

`Note:`
values of SkyflowElements will be returned in elementstate object only when `env` is  `DEV`,  else it is empty string i.e, ''

##### Sample code snippet for using listeners
```javascript
//create skyflow client
const skyflowClient = Skyflow.init({
   vaultID: <VAULT_ID>,          
   vaultURL: <VAULT_URL>,
   getBearerToken: ()=>{},
   options: { 
     env: Skyflow.Env.DEV
   }
})

const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)

const cardNumber = container.create({
        table: "pii_fields",
        column: "primary_card.card_number",
        type: Skyflow.ElementType.CARD_NUMBER,
      });

cardNumber.mount("#cardNumberContainer");

//subscribing to CHANGE event, which gets triggered when element changes
cardNumber.on(Skyflow.EventName.CHANGE,(state) => {
  // Your implementation when Change event occurs
  console.log(state)
});
```
##### Sample Element state object when `env` is `DEV`

```javascript
{
   elementType: "CARD_NUMBER"
   isEmpty: false
   isFocused: true
   isValid: false
   value: "411"
}

```
##### Sample Element state object when `env` is `PROD`

```javascript
{
   elementType: "CARD_NUMBER"
   isEmpty: false
   isFocused: true
   isValid: false
   value: ''
}
```

### UI Error for Collect Elements

Helps to display custom error messages on the Skyflow Elements through the methods `setError` and `resetError` on the elements.

`setError(error: string)` method is used to set the error text for the element, when this method is trigerred, all the current errors present on the element will be overridden with the custom error message passed. This error will be displayed on the element until `resetError()` is trigerred on the same element.

`resetError()` method is used to clear the custom error message that is set using `setError`.

##### Sample code snippet for setError and resetError

```javascript

const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)

const cardNumber = container.create({
    table: "pii_fields",
    column: "primary_card.card_number",
    type: Skyflow.ElementType.CARD_NUMBER,
});

//Set custom error
cardNumber.setError("custom error");

//reset custom error
cardNumber.resetError();

```

### Set and Clear value for Collect Elements (DEV ENV ONLY)

`setValue(value: string)` method is used to set the value of the element. This method will override any previous value present in the element.

`clearValue()` method is used to reset the value of the element.

`Note:` This methods are only available in DEV env for testing/developmental purposes and MUST NOT be used in PROD env.

##### Sample code snippet for setValue and clearValue

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)

const cardNumber = container.create({
    table: "pii_fields",
    column: "primary_card.card_number",
    type: Skyflow.ElementType.CARD_NUMBER,
});

// Set a value programatically
cardNumber.setValue("4111111111111111");

// Clear the value
cardNumber.clearValue();

```

---


# Securely revealing data client-side
-  [**Retrieving data from the vault**](#retrieving-data-from-the-vault)
-  [**Using Skyflow Elements to reveal data**](#using-skyflow-elements-to-reveal-data)
-  [**UI Error for Reveal Elements**](#ui-error-for-reveal-elements)
-  [**Set token for Reveal Elements**](#set-token-for-reveal-elements)
- [**Set and clear altText for Reveal Elements**](#set-and-clear-alttext-for-reveal-elements)

## Retrieving data from the vault

For non-PCI use-cases, retrieving data from the vault and revealing it in the browser can be done either using the SkyflowID's or tokens as described below

- ### Using Skyflow tokens
    For retrieving using tokens, use the `detokenize(records)` method. The records parameter takes a JSON object that contains `records` to be fetched as shown below.

```javascript
const records = {
  "records": [
      {
        token: "string",                    // token for the record to be fetched
      }
  ]
}

skyflow.detokenize(records)
```
An example of a detokenize call: 

```javascript
skyflow.detokenize({
  "records": [
    {
      token: "131e70dc-6f76-4319-bdd3-96281e051051"
    }
  ]
})
```

The sample response:
```javascript
{
  "records": [
    {
      "token": "131e70dc-6f76-4319-bdd3-96281e051051",
      "value": "1990-01-01",
    }
  ]
}
```

- ### Using Skyflow ID's
    For retrieving using SkyflowID's, use the `getById(records)` method.The records parameter takes a JSON object that contains `records` to be fetched as shown below.

```javascript
{
  "records": [
    {
      ids: string[],                      // array of SkyflowID's of the records to be fetched
      table: string                       // table holding the above skyflow_id's
      redaction: Skyflow.RedactionType    // redaction to be applied to retrieved data
    }
  ]
}
```

There are 4 accepted values in Skyflow.RedactionTypes:
- `PLAIN_TEXT`
- `MASKED`
- `REDACTED`
- `DEFAULT`

An example of getById call:

```javascript

skyflow.getById({
  records: [
    {
      ids: ["f8d8a622-b557-4c6b-a12c-c5ebe0b0bfd9"],
      table: "cards",
      redaction: Skyflow.RedactionType.PLAIN_TEXT,
    },
    {
      ids: ["da26de53-95d5-4bdb-99db-8d8c66a35ff9"],
      table: "contacts",
      redaction: Skyflow.RedactionType.PLAIN_TEXT,
    },
  ],
});
```

The sample response:

```javascript
{
    "records": [
        {
            "fields": {
                "card_number": "4111111111111111",
                "cvv": "127",
                "expiry_date": "11/2035",
                "fullname": "myname",
                "id": "f8d8a622-b557-4c6b-a12c-c5ebe0b0bfd9"
            },
            "table": "cards"
        }
    ],
    "errors": [
        {
            "error": {
                "code": "404",
                "description": "No Records Found"
            },
            "ids": ["da26de53-95d5-4bdb-99db-8d8c66a35ff9"]
        }
    ]
}
```

## Using Skyflow Elements to reveal data

Skyflow Elements can be used to securely reveal data in a browser without exposing your front end to the sensitive data. This is great for use cases like card issuance where you may want to reveal the card number to a user without increasing your PCI compliance scope. 

### Step 1: Create a container
To start, create a container using the `container(Skyflow.ContainerType)` method of the Skyflow client as shown below.

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL)
```

### Step 2: Create a reveal Element

Then define a Skyflow Element to reveal data as shown below. 

```javascript
const revealElement = {
  token: "string",                    //optional, token of the data being revealed 
  inputStyles: {},                    //optional styles to be applied to the element
  labelStyles: {},                    //optional, styles to be applied to the label of the reveal element
  errorTextStyles: {},                //optional styles that will be applied to the errorText of the reveal element
  label: "string",                    //optional, label for the form element
  altText: "string"                   //optional, string that is shown before reveal, will show token if altText is not provided
}
```
`Note`: 
- `token` is optional only if it is being used in invokeConnection()

The `inputStyles`, `labelStyles` and  `errorTextStyles` parameters accepts a styles object as described in the [previous section](#step-2-create-a-collect-element) for collecting data but only a single variant is available i.e. base. 

An example of a inputStyles object:

```javascript
inputStyles: {
    base: {
      color: "#1d1d1d"
    }
}
```

An example of a labelStyles object:

```javascript
labelStyles: {
    base: {
      fontSize: "12px",
      fontWeight: "bold"
    }
}
```

An example of a errorTextStyles object:

```javascript
errorTextStyles: {
    base: {
      color: "#f44336"
    }
}
```

Once you've defined a Skyflow Element, you can use the `create(element)` method of the container to create the Element as shown below: 

```javascript
const element = container.create(revealElement)
```

### Step 3: Mount Elements to the DOM

Elements used for revealing data are mounted to the DOM the same way as Elements used for collecting data. Refer to Step 3 of the [section above](#step-3-mount-elements-to-the-dom).


### Step 4: Reveal data
When the sensitive data is ready to be retrieved and revealed, call the `reveal()` method on the container as shown below: 

```javascript
container.reveal()
  .then((data) => {
    //handle success
  })
  .catch((err) => {
    //handle error
  })
```


### End to end example of all steps

```javascript
//Step 1
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL)

//Step 2
const cardNumberElement = container.create({             
  token: "b63ec4e0-bbad-4e43-96e6-6bd50f483f75",
  inputStyles: {
      base: {
        color: "#1d1d1d",
      },
  },
  labelStyles: {
    base: {
      fontSize: "12px",
    }
  },
  errorTextStyles: {
    base: {
      color: "#f44336"
    }
  }, 
  label: "card_number",
  altText: "XXXX XXXX XXXX XXXX" 
})

const cvvElement = container.create({             
  token: "89024714-6a26-4256-b9d4-55ad69aa4047",
  inputStyles: {
      base: {
        color: "#1d1d1d",
      },
    },
  label: "cvv",
  altText: "XXX" 
})

//Step 3
cardNumberElement.mount("#cardNumber")  //assumes there is a placeholder div with id="#cardNumber" on the page
cvvElement.mount("#cvv")  //assumes there is a placeholder div with id="#cvv" on the page
                                        
//Step 4    
container                                       
 .reveal()                              
 .then((data) => {
   //handle success
 })
 .catch((err) => {
   //handle error
 });
```

The response below shows that some tokens assigned to the reveal elements get revealed successfully, while others fail and remain unrevealed.

### Sample Response

```
{
  "success": [
    {
      "token": "b63ec4e0-bbad-4e43-96e6-6bd50f483f75"
    }
  ],
 "errors": [
    {
       "token": "89024714-6a26-4256-b9d4-55ad69aa4047",
       "error": {
         "code": 404,
         "description": "Tokens not found for 89024714-6a26-4256-b9d4-55ad69aa4047"
       } 
   }   
  ]
}
```

### UI Error for Reveal Elements
Helps to display custom error messages on the Skyflow Elements through the methods `setError` and `resetError` on the elements.

`setError(error: string)` method is used to set the error text for the element, when this method is trigerred, all the current errors present on the element will be overridden with the custom error message passed. This error will be displayed on the element until `resetError()` is trigerred on the same element.

`resetError()` method is used to clear the custom error message that is set using `setError`.

##### Sample code snippet for setError and resetError

```javascript

const container = skyflowClient.container(Skyflow.ContainerType.REVEAL)

const cardNumber = container.create({
   token: "89024714-6a26-4256-b9d4-55ad69aa4047",
});

//Set custom error
cardNumber.setError("custom error");

//reset custom error
cardNumber.resetError();

```
### Set token for Reveal Elements

The `setToken(value: string)` method can be used to set the token of the Reveal Element. If no altText is set, the set token will be displayed on the UI as well. If altText is set, then there will be no change in the UI but the token of the element will be internally updated.

##### Sample code snippet for setToken
```javascript
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL)

const cardNumber = container.create({
   altText:"Card Number",
});

// set token 
cardNumber.setToken("89024714-6a26-4256-b9d4-55ad69aa4047");

```
### Set and Clear altText for Reveal Elements
The `setAltText(value: string)` method can be used to set the altText of the Reveal Element. This will cause the altText to be displayed in the UI regardless of whether the token or value is currently being displayed.

`clearAltText()` method can be used to clear the altText, this will cause the element to display the token or actual value of the element. If the element has no token, the element will be empty.
##### Sample code snippet for setAltText and clearAltText

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL)

const cardNumber = container.create({
   token:"89024714-6a26-4256-b9d4-55ad69aa4047",
});

// set altText
cardNumber.setAltText("Card Number");

//clear altText
cardNumber.clearAltText(); 
```
# Securely invoking Connections client-side
Using Skyflow Connections, end-user applications can integrate checkout/card issuance flow without any of their apps/systems touching the PCI compliant fields like cvv, card number. To invoke Connections, use the `invokeConnection(connectionConfig)` method of the Skyflow client.

```javascript
const connectionConfig = {
  connectionURL: string, // connection url recevied when creating a skyflow Connection integration
  methodName: Skyflow.RequestMethod,
  pathParams: any,	// optional
  queryParams: any,	// optional
  requestHeader: any, // optional
  requestBody: any,	// optional
  responseBody: any	// optional
}

const response =  skyflowClient.invokeConnection(connectionConfig);
```
`methodName` supports the following methods:

- GET
- POST
- PUT
- PATCH
- DELETE

**pathParams, queryParams, requestHeader, requestBody** are the JSON objects that will be sent through the Connection integration url.

The values in the above parameters can contain collect elements, reveal elements or actual values. When elements are provided inplace of values, they get replaced with the value entered in the collect elements or value present in the reveal elements

**responseBody**:  
It is a JSON object that specifies where to render the response in the UI. The values in the responseBody can contain collect elements or reveal elements. 

Sample use-cases on using invokeConnection():

###  Sample use-case 1:

Merchant acceptance - customers should be able to complete payment checkout without cvv touching their application. This means that the merchant should be able to receive a CVV and process a payment without exposing their front-end to any PCI data

```javascript
// step 1
const skyflowClient = skyflow.init({
	 getBearerToken: <helperFunc>
});

// step 2
const collectContainer = skyflowClient.container(Skyflow.ContainerType.COLLECT)

// step 3
const cardNumberElement = collectContainer.create({           
  type: skyflow.ElementType.CARD_NUMBER
})
cardNumberElement.mount("#cardNumber")

const cvvElement = collectContainer.create({
    type: skyflow.ElementType.CVV
})
cvvElement.mount("#cvv")

// step 4
const connectionConfig = { 
  connectionURL: <connection_url>,
  methodName: Skyflow.RequestMethod.POST,
  requestBody: {
   card_number: cardNumberElement, //it can be skyflow element(collect or reveal) or actual value
   cvv: cvvElement,  
  }
}

const response =  skyflowClient.invokeConnection(connectionConfig);
```

Sample Response:
```javascript
{
   "receivedTimestamp": "2019-05-29 21:49:56.625",
   "processingTimeinMs": 116
}
```
In the above example,  CVV is being collected from the user input at the time of checkout and not stored anywhere in the vault

`Note:`  
- card_number can be either container element or plain text value (tokens or actual value)
- `table` and `column` names are not required for creating collect element, if it is used for invokeConnection method, since they will not be stored in the vault

 ### Sample use-case 2:
 
 Card issuance -  customers want to issue cards from card issuer service and should generate the CVV dynamically without increasing their PCI scope.
```javascript
// step 1
const skyflowClient = skyflow.init({
	 getBearerToken: <helperFunc>
});

// step 2
const revealContainer = skyflowClient.container(Skyflow.ContainerType.REVEAL)
const collectContainer = skyflowClient.container(Skyflow.ContainerType.COLLECT)

// step 3
const cvvElement = revealContainer.create({
    altText: "###",
})
cvvElement.mount("#cvv")

const expiryDateElement = collectContainer.create({
    type: skyflow.ElementType.EXPIRATION_DATE
})
expiryDateElement.mount("#expirationDate")

//step 4
const connectionConfig = { 
  connectionURL: <connection_url>,
  methodName: Skyflow.RequestMethod.POST,
  pathParams: {
     card_number: "0905-8672-0773-0628"	//it can be skyflow element(collect/reveal) or token or actual value
  },
  requestBody: {
    expirationDate: expiryDateElement //it can be skyflow element(collect/reveal) or token or actual value
 },
 responseBody: {
     resource: {
         cvv2: cvvElement   // pass the element where the cvv response from the Connection will be mounted
       }
     }  
   }
}

const response = skyflowClient.invokeConnection(connectionConfig);
```

Sample Response:
```javascript
{
   "receivedTimestamp": "2019-05-29 21:49:56.625",
   "processingTimeinMs": 116
}
```

`Note`:
- `token` is optional for creating reveal element, if it is used for invokeConnection
- responseBody contains collect or reveal elements to render the response from the Connection on UI 