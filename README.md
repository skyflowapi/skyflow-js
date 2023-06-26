# skyflow-js
Skyflow’s JavaScript SDK can be used to securely collect, tokenize, and reveal sensitive data in the browser without exposing your front-end infrastructure to sensitive data.

---

[![CI](https://img.shields.io/static/v1?label=CI&message=passing&color=green?style=plastic&logo=github)](https://github.com/skyflowapi/skyflow-js/actions)
[![GitHub release](https://img.shields.io/github/v/release/skyflowapi/skyflow-js.svg)](https://www.npmjs.com/package/skyflow-js)
[![License](https://img.shields.io/github/license/skyflowapi/skyflow-android)](https://github.com/skyflowapi/skyflow-js/blob/master/LICENSE)

# Table of Contents
- [**Including Skyflow.js**](#Including-Skyflowjs) 
- [**Initializing Skyflow.js**](#Initializing-Skyflowjs)
- [**Securely collecting data client-side**](#Securely-collecting-data-client-side)
- [**Securely collecting data client-side using Composable Elements**](#Securely-collecting-data-client-side-using-Composable-Elements)
- [**Securely revealing data client-side**](#Securely-revealing-data-client-side)
- [**Securely deleting data cleint-side**](#Securely-deleting-data-client-side)

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
import Skyflow from 'skyflow-js' // If using script tag, this line is not required.

const skyflowClient = Skyflow.init({
  vaultID: 'string',          // Id of the vault that the client should connect to.
  vaultURL: 'string',         // URL of the vault that the client should connect to.
  getBearerToken: helperFunc, // Helper function that retrieves a Skyflow bearer token from your backend.
  options: {
    logLevel: Skyflow.LogLevel, // Optional, if not specified default is ERROR. 
    env: Skyflow.Env            // Optional, if not specified default is PROD. 
  }
});
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
const getBearerToken = () => {
  return new Promise((resolve, reject) => {
    const Http = new XMLHttpRequest();

    Http.onreadystatechange = () => {
      if (Http.readyState === 4) {
        if (Http.status === 200) {
          const response = JSON.parse(Http.responseText);
          resolve(response.accessToken);
        } else {
          reject('Error occured');
        }
      }
    };

    Http.onerror = error => {
      reject('Error occured');
    };

    const url = 'https://api.acmecorp.com/skyflowToken';
    Http.open('GET', url);
    Http.send();
  });
};

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
-  [**Insert data into the vault**](#insert-data-into-the-vault)
-  [**Using Skyflow Elements to collect data**](#using-skyflow-elements-to-collect-data)
-  [**Using Skyflow Elements to update data**](#using-skyflow-elements-to-update-data)
-  [**Using validations on Collect Elements**](#validations)
-  [**Event Listener on Collect Elements**](#event-listener-on-collect-elements)
-  [**UI Error for Collect Elements**](#ui-error-for-collect-elements)
- [**Set and Clear value for Collect Elements (DEV ENV ONLY)**](#set-and-clear-value-for-collect-elements-dev-env-only)
- [**Using Skyflow File Element to upload a file**](#using-skyflow-file-element-to-upload-a-file)
## Insert data into the vault

To insert data into the vault, use the `insert(records, options?)` method of the Skyflow client. The `records` parameter takes a JSON object of the records to insert into the below format. The `options` parameter takes a dictionary of optional parameters for the insertion. The `insert` method also supports upsert operations.

```javascript
const records = {
  records: [
    {
      table: 'string',          // Table into which record should be inserted.
      fields: {
        column1: 'value',      // Column names should match vault column names.
        //...additional fields here
      },
    },
    // ...additional records here.
  ],
};

const options = {
  tokens: true,               // Indicates whether or not tokens should be returned for the inserted data. Defaults to 'true'  
  upsert: [                   // Upsert operations support in the vault
      {
        table: 'string',      // Table name
        column: 'value',      // Unique column in the table
      }
    ]
}

skyflowClient.insert(records, options);
```

An [example](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/pure-js.html) of an insert call: 
```javascript
skyflowClient.insert({
  records: [
    {
      table: 'cards',
      fields: {
        cardNumber: '41111111111',
        cvv: '123',
      },
    },
  ],
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

**Skyflow Elements** provide developers with pre-built form elements to securely collect sensitive data client-side. These elements are hosted by Skyflow and injected into your web page as iFrames. This reduces your PCI compliance scope by not exposing your front-end application to sensitive data. Follow the steps below to securely collect data with Skyflow Elements on your web page. 

### Step 1: Create a container

First create a container for the form elements using the `container(Skyflow.ContainerType)` method of the Skyflow client as show below:

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)
```

### Step 2: Create a collect Element

A Skyflow collect Element is defined as shown below: 

```javascript
const collectElement = {
  table: 'string',             // Required, the table this data belongs to.
  column: 'string',            // Required, the column into which this data should be inserted.
  type: Skyflow.ElementType,   // Skyflow.ElementType enum.
  inputStyles: {},             // Optional, styles that should be applied to the form element.
  labelStyles: {},             // Optional, styles that will be applied to the label of the collect element.
  errorTextStyles: {},         // Optional, styles that will be applied to the errorText of the collect element.
  label: 'string',             // Optional, label for the form element.
  placeholder: 'string',       // Optional, placeholder for the form element.
  altText: 'string',           // (DEPRECATED) string that acts as an initial value for the collect element.
  validations: [],             // Optional, array of validation rules.
}
```
The `table` and `column` fields indicate which table and column in the vault the Element corresponds to. 

**Note**: 
-  Use dot delimited strings to specify columns nested inside JSON fields (e.g. `address.street.line1`)

The `inputStyles` field accepts a style object which consists of CSS properties that should be applied to the form element in the following states:
* `base`: all variants inherit from these styles
* `complete`: applied when the Element has valid input
* `empty`: applied when the Element has no input
* `focus`: applied when the Element has focus
* `invalid`: applied when the Element has invalid input
* `cardIcon`: applied to the card type icon in CARD_NUMBER Element
* `copyIcon`: applied to copy icon in Elements when enableCopy option is true

Styles are specified with [JSS](https://cssinjs.org/?v=v10.7.1). 

An example of a inputStyles object:
```javascript
inputStyles: {
  base: {
    border: '1px solid #eae8ee',
    padding: '10px 16px',
    borderRadius: '4px',
    color: '#1d1d1d',
    '&:hover': {    // Hover styles.
        borderColor: 'green'
    },
  },
  complete: {
    color: '#4caf50',
  },
  empty: {},
  focus: {},
  invalid: {
    color: '#f44336',
  },
  cardIcon: {
    position: 'absolute',
    left: '8px',
    bottom: 'calc(50% - 12px)',
  },
  copyIcon: {
    position: 'absolute',
    right: '8px',
  },
},
```
The states that are available for `labelStyles` are `base` and `focus`.

An example of a labelStyles object:

```javascript
labelStyles: {
  base: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  focus: {
    color: '#1d1d1d',
  },
},
```

The state that is available for `errorTextStyles` is only the `base` state, it shows up when there is some error in the collect element.

An example of a errorTextStyles object:

```javascript
errorTextStyles: {
  base: {
    color: '#f44336',
  },
},
```

Finally, the `type` field takes a Skyflow ElementType. Each type applies the appropriate regex and validations to the form element. There are currently 8 types:
- `CARDHOLDER_NAME`
- `CARD_NUMBER`
- `EXPIRATION_DATE`
- `EXPIRATION_MONTH`
- `EXPIRATION_YEAR`
- `CVV`
- `INPUT_FIELD`
- `PIN`
- `FILE_INPUT`
  

The `INPUT_FIELD` type is a custom UI element without any built-in validations. For information on validations, see [validations](#validations).

Along with CollectElement we can define other options which takes a object of optional parameters as described below:

```javascript
const options = {
  required: false,      // Optional, indicates whether the field is marked as required. Defaults to 'false'.
  enableCardIcon: true, // Optional, indicates whether a card icon should be enabled (only applicable for CARD_NUMBER ElementType).
  enableCopy: false,    // Optional, enables the copy icon to collect elements to copy text to clipboard. Defaults to 'false').
  format: String,       // Optional, format for the element 
  translation: {}      // Optional, indicates the allowed data type value for format. 
};
```

`required`: Indicates whether the field is marked as required or not. If not provided, it defaults to false.

`enableCardIcon` : Indicates whether the icon is visible for the CARD_NUMBER element. Defaults to true.

`enableCopy` : Indicates whether the copy icon is visible in collect and reveal elements.

`format`: A string value that indicates the format pattern applicable to the element type.
Only applicable to EXPIRATION_DATE, CARD_NUMBER, EXPIRATION_YEAR, and INPUT_FIELD elements.
  - For INPUT_FIELD elements,
    - the length of `format` determines the expected length of the user input.
    - if `translation` isn't specified, the `format` value is considered a string literal.

`translation`: An object of key value pairs, where the key is a character that appears in `format` and the value is a simple regex pattern of acceptable inputs for that character. Each key can only appear once. Only applicable for INPUT_FIELD elements.

Accepted values by element type:

| Element type    | `format`and `translation` values                                                                                                                                                             | Examples                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| EXPIRATION_DATE | <li>`format`</li> <ul><li>`mm/yy` (default)</li><li>`mm/yyyy`</li><li>`yy/mm`</li><li>`yyyy/mm`</li></ul>                                                                                    | <ul><li>12/27</li><li>12/2027</li> <li>27/12</li> <li> 2027/12</li></ul></ul>                                                              |
| EXPIRATION_YEAR | <li>`format`</li> <ul><li>`yy` (default)</li><li>`yyyy`</li></ul>                                                                                                                            | <ul><li>27</li><li>2027</li></ul>                                                                                                          |
| CARD_NUMBER     | <li>`format`</li> <ul><li>`XXXX XXXX XXXX XXXX` (default)</li><li>`XXXX-XXXX-XXXX-XXXX`</li></ul>                                                                                            | <ul><li>1234 5678 9012 3456</li><li>1234-5678-9012-3456</li></ul>                                                                          |
| INPUT_FIELD     | <li>`format`: A string that matches the desired output, with placeholder characters of your choice.</li><li>`translation`: An object of key/value pairs. Defaults to `{"X": "[0-9]"}`</li>   | With a `format` of `+91 XXXX-XX-XXXX` and a `translation` of `[ "X": "[0-9]"]`, user input of "1234121234" displays as "+91 1234-12-1234". |

**Collect Element Options examples for INPUT_FIELD**
Example 1
```js
const options = {
  required: true, 
  enableCardIcon: true,
  format:'+91 XXXX-XX-XXXX',
  translation: { 'X': '[0-9]' } 
}
```

User input: "1234121234"
Value displayed in INPUT_FIELD: "+91 1234-12-1234"

Example 2
```js
const options = {
  required: true, 
  enableCardIcon: true,
  format: 'AY XX-XXX-XXXX',
  translation: { 'X': '[0-9]',  'Y': '[A-Z]' } 
}
```

User input: "B1234121234"
Value displayed in INPUT_FIELD: "AB 12-341-2123"

Once the Element object and options has been defined, add it to the container using the `create(element, options)` method as shown below. The `element` param takes a Skyflow Element object and options as defined above:

```javascript
const collectElement = {
  table: 'string',             // Required, the table this data belongs to.
  column: 'string',            // Required, the column into which this data should be inserted.
  type: Skyflow.ElementType,   // Skyflow.ElementType enum.
  inputStyles: {},             // Optional, styles that should be applied to the form element.
  labelStyles: {},             // Optional, styles that will be applied to the label of the collect element.
  errorTextStyles: {},         // Optional, styles that will be applied to the errorText of the collect element.
  label: 'string',             // Optional, label for the form element.
  placeholder: 'string',       // Optional, placeholder for the form element.
  altText: 'string',           // (DEPRECATED) string that acts as an initial value for the collect element.
  validations: [],             // Optional, array of validation rules.
}

const options = {
  required: false,      // Optional, indicates whether the field is marked as required. Defaults to 'false'.
  enableCardIcon: true, // Optional, indicates whether card icon should be enabled (only applicable for CARD_NUMBER ElementType).
  format: String,       // Optional, format for the element (only applicable currently for EXPIRATION_DATE ElementType).
  enableCopy: false,    // Optional, enables the copy icon in collect and reveal elements to copy text to clipboard. Defaults to 'false').
};

const element = container.create(collectElement, options);
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
element.mount('#cardNumber');
```
you can use the `unmount` method to reset any collect element to it's initial state.
```javascript
element.unmount();
```

### Step 4: Collect data from Elements

When the form is ready to be submitted, call the `collect(options?)` method on the container object. The `options` parameter takes a object of optional parameters as shown below: 

- `tokens`: indicates whether tokens for the collected data should be returned or not. Defaults to 'true'
- `additionalFields`: Non-PCI elements data to be inserted into the vault which should be in the `records` object format as described in the above [Insert data into vault](#insert-data-into-the-vault) section.
-  `upsert`: To support upsert operations while collecting data from Skyflow elements, pass the table and column marked as unique in the table.

```javascript
const options = {
  tokens: true,                             // Optional, indicates whether tokens for the collected data should be returned. Defaults to 'true'.
  additionalFields: {
    records: [
      {
        table: 'string',                   // Table into which record should be inserted.
        fields: {
          column1: 'value',                // Column names should match vault column names.
          // ...additional fields here.
        },
      },
      // ...additional records here.
    ],
  },                                      // Optional
  upsert: [                               // Upsert operations support in the vault                                    
    {
      table: 'string',                    // Table name
      column: 'value',                    // Unique column in the table
    },
  ],                                      // Optional
};

container.collect(options);
```

### End to end example of collecting data with Skyflow Elements

**[Sample Code:](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/skyflow-elements.html)**

```javascript
//Step 1
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT);

//Step 2
const element = container.create({
  table: 'cards',
  column: 'cardNumber',
  inputstyles: {
    base: {
      color: '#1d1d1d',
    },
    cardIcon: {
      position: 'absolute',
      left: '8px',
      bottom: 'calc(50% - 12px)',
    },
  },
  labelStyles: {
    base: {
      fontSize: '12px',
      fontWeight: 'bold',
    },
  },
  errorTextStyles: {
    base: {
      color: '#f44336',
    },
  },
  placeholder: 'Card Number',
  label: 'card_number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

// Step 3
element.mount('#cardNumber'); // Assumes there is a div with id='#cardNumber' in the webpage.

// Step 4

const nonPCIRecords = {
  records: [
    {
      table: 'cards',
      fields: {
        gender: 'MALE',
      },
    },
  ],
};

container.collect({
  tokens: true,
  additionalFields: nonPCIRecords,
});

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
### Insert call example with upsert support
**Sample Code**

 ```javascript
//Step 1
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT) 
 
//Step 2
const cardNumberElement = container.create({           
  table: 'cards',
  column: 'card_number',
  inputStyles: {
      base: {
        color: '#1d1d1d',
      },
      cardIcon:{
        position: 'absolute',
        left:'8px', 
        bottom:'calc(50% - 12px)'
    },
  },
  labelStyles: {
      base: {
        fontSize: '12px',
        fontWeight: 'bold'
      }
  },
  errorTextStyles: {
      base: {
        color: '#f44336'
      }
  },
  placeholder: 'Card Number',
  label: 'card_number',
  type: Skyflow.ElementType.CARD_NUMBER
})


const cvvElement = container.create({           
  table: 'cards',
  column: 'cvv',
  inputStyles: {
      base: {
        color: '#1d1d1d',
      },
      cardIcon:{
        position: 'absolute',
        left:'8px', 
        bottom:'calc(50% - 12px)'
    },
  },
  labelStyles: {
      base: {
        fontSize: '12px',
        fontWeight: 'bold'
      }
  },
  errorTextStyles: {
      base: {
        color: '#f44336'
      }
  },
  placeholder: 'CVV',
  label: 'cvv',
  type: Skyflow.ElementType.CVV
})

// Step 3
cardNumberElement.mount('#cardNumber')  //Assumes there is a div with id='#cardNumber' in the webpage.
cvvElement.mount('#cvv'); //Assumes there is a div with id='#cvv' in the webpage.
 
// Step 4
 container.collect({
  tokens: true,
  upsert: [
    {
      table: 'cards', 
      column: 'card_number', 
    }
  ]
})
 ```
 **Skyflow returns tokens for the record you just inserted.**
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
## Using Skyflow Elements to update data

You can update the data in a vault with Skyflow Elements. Use the following steps to securely update data. 

### Step 1: Create a container
Create a container for the form elements using the `container(Skyflow.ContainerType)` method of the Skyflow client:

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)
```

### Step 2: Create a collect Element 
Create a collect element. Collect Elements are defined as follows:

```javascript
const collectElement = {
 table: "string",             // Required, the table this data belongs to.
 column: "string",            // Required, the column into which this data should be updated.
 type: Skyflow.ElementType,   // Skyflow.ElementType enum.
 inputStyles: {},             // Optional, styles that should be applied to the form element.
 labelStyles: {},             // Optional, styles that will be applied to the label of the collect element.
 errorTextStyles: {},         // Optional, styles that will be applied to the errorText of the collect element.
 label: "string",             // Optional, label for the form element.
 placeholder: "string",       // Optional, placeholder for the form element.
 altText: "string",           // (DEPRECATED) string that acts as an initial value for the collect element.
 validations: [],             // Optional, array of validation rules.
 skyflowID: "string",         // The skyflow_id of the record to be updated.
};
const options = {
 required: false,             // Optional, indicates whether the field is marked as required. Defaults to 'false'.
 enableCardIcon: true,        // Optional, indicates whether  the element needs a card icon (only applicable for CARD_NUMBER ElementType).
 format: String,              // Optional, format for the element (only applicable currently for EXPIRATION_DATE ElementType).
 enableCopy: false,           // Optional, enables the copy icon in collect and reveal elements to copy text to clipboard. Defaults to 'false').
};
const element = container.create(collectElement, options);
```
The `table` and `column` fields indicate which table and column the Element corresponds to.

`skyflowID` indicates the record that you want to update.

**Notes:** 
- Use dot-delimited strings to specify columns nested inside JSON fields (for example, `address.street.line1`)

### Step 3: Mount Elements to the DOM 
To specify where the Elements are rendered on your page, create placeholder `<div>` elements with unique `id` tags. For instance, the form below has three empty elements with unique IDs as placeholders for three Skyflow Elements.
```html
<form>
 <div id="cardNumber" />
 <br/>
 <div id="expireDate" />
 <br/>
 <div id="cvv" />
 <br/>
 <button type="submit">Submit</button>
</form>
```
Now, when you call the `mount(domElement)` method, the Elements is inserted in the specified divs. For instance, the call below inserts the Element into the div with the id "#cardNumber".
```javascript
element.mount('#cardNumber');
```
Use the `unmount` method to reset a Collect Element to its initial state.
```javascript
element.unmount();
```


### Step 4: Update data from Elements 
When the form is ready to submit, call the `collect(options?)` method on the container object. The `options` parameter takes a object of optional parameters as shown below:
- `tokens`: indicates whether tokens for the collected data should be returned or not. Defaults to 'true'
- `additionalFields`: Non-PCI elements data to update or insert into the vault which should be in the records object format.
- `upsert`: To support upsert operations while collecting data from Skyflow elements, pass the table and column marked as unique in the table.

```javascript
const options = {
 tokens: true,                   // Optional, indicates whether tokens for the collected data should be returned. Defaults to 'true'.
 additionalFields: {
   records: [
     {
       table: "string",          // Table into which record should be updated.
       fields: {
         column1: "value",       // Column names should match vault column names.
         skyflowID: "value",     // The skyflow_id of the record to be updated.
        // ...additional fields here.
       },
     },
     // ...additional records here.
   ],
 },// Optional
 upsert: [                       // Upsert operations support in the vault
   {
     table: "string",            // Table name
     column: "value",            // Unique column in the table
   },
 ], // Optional
};
container.collect(options);
```
**Note:** `skyflowID` is required if you want to update the data. If `skyflowID` isn't specified, the `collect(options?)` method creates a new record in the vault.

### End to end example of updating data with Skyflow Elements

**Sample Code:**

```javascript
//Step 1
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT);

//Step 2
const cardNumberElement = container.create({
 table: 'cards',
 column: 'cardNumber',
 inputStyles: {
   base: {
     color: '#1d1d1d',
   },
   cardIcon: {
     position: 'absolute',
     left: '8px',
     bottom: 'calc(50% - 12px)',
   },
 },
 labelStyles: {
   base: {
     fontSize: '12px',
     fontWeight: 'bold',
   },
 },
 errorTextStyles: {
   base: {
     color: '#f44336',
   },
 },
 placeholder: 'Card Number',
 label: 'Card Number',
 type: Skyflow.ElementType.CARD_NUMBER,
 skyflowID:  '431eaa6c-5c15-4513-aa15-29f50babe882',
});
const cardHolderNameElement = container.create({
 table: 'cards',
 column: 'first_name',
 inputStyles: {
   base: {
     color: '#1d1d1d',
   },
   cardIcon: {
     position: 'absolute',
     left: '8px',
     bottom: 'calc(50% - 12px)',
   },
 },
 labelStyles: {
   base: {
     fontSize: '12px',
     fontWeight: 'bold',
   },
 },
 errorTextStyles: {
   base: {
     color: '#f44336',
   },
 },
 placeholder: 'Card Holder Name',
 label: 'Card Holder Name',
 type: Skyflow.ElementType.CARDHOLDER_NAME,
 skyflowID:  '431eaa6c-5c15-4513-aa15-29f50babe882',
});

// Step 3
cardNumberElement.mount('#cardNumber');          // Assumes there is a div with id='#cardNumber' in the webpage.
cardHolderNameElement.mount('#cardHolderName');  // Assumes there is a div with id='#cardHolderName' in the webpage.

// Step 4
const nonPCIRecords = {
 records: [
   {
     table: 'cards',
     fields: {
       gender: 'MALE',
       skyflowID:  '431eaa6c-5c15-4513-aa15-29f50babe882',
     },
   },
 ],
};

container.collect({
 tokens: true,
 additionalFields: nonPCIRecords,
});
```
**Sample Response :**
```javascript
{
 "records": [
   {
     "table": "cards",
     "fields": {
       "skyflow_id": "431eaa6c-5c15-4513-aa15-29f50babe882",
       "cardNumber": "f3907186-e7e2-466f-91e5-48e12c2bcbc1",
       "first_name": "131e70dc-6f76-4319-bdd3-96281e051051",
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
- `CARD_NUMBER`: Card number validation with checkSum algorithm(Luhn algorithm).
Available card lengths for defined card types are [12, 13, 14, 15, 16, 17, 18, 19]. 
A valid 16 digit card number will be in the format - `XXXX XXXX XXXX XXXX`
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
    error: string // Optional, default error is 'VALIDATION FAILED'.
  }
}
```

- `LENGTH_MATCH_RULE`: You can use this rule to set the minimum and maximum permissible length of the input field value

```javascript
const lengthMatchRule = {
  type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
  params: {
    min : number, // Optional.
    max : number, // Optional.
    error: string // Optional, default error is 'VALIDATION FAILED'.
  }
}
```

- `ELEMENT_VALUE_MATCH_RULE`: You can use this rule to match the value of one element with another element

```javascript
const elementValueMatchRule = {
  type: Skyflow.ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
  params: {
    element: CollectElement,
    error: string // Optional, default error is 'VALIDATION FAILED'.
  }
}
```

The Sample [code snippet](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/custom-validations.html) for using custom validations:

```javascript
/*
  A simple example that illustrates custom validations.
  Adding REGEX_MATCH_RULE , LENGTH_MATCH_RULE to collect element.
*/

// This rule allows 1 or more alphabets.
const alphabetsOnlyRegexRule = {
  type: Skyflow.ValidationRuleType.REGEX_MATCH_RULE,
  params: {
    regex: /^[A-Za-z]+$/,
    error: 'Only alphabets are allowed',
  },
};

// This rule allows input length between 4 and 6 characters.
const lengthRule = {
  type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
  params: {
    min: 4,
    max: 6,
    error: 'Must be between 4 and 6 alphabets',
  },
};

const cardHolderNameElement = collectContainer.create({
  table: 'pii_fields',
  column: 'first_name',
  ...collectStylesOptions,
  label: 'Card Holder Name',
  placeholder: 'cardholder name',
  type: Skyflow.ElementType.INPUT_FIELD,
  validations: [alphabetsOnlyRegexRule, lengthRule],
});

/*
  Reset PIN - A simple example that illustrates custom validations.
  The below code shows an example of ELEMENT_VALUE_MATCH_RULE
*/

// For the PIN element
const pinElement = collectContainer.create({
  label: 'PIN',
  placeholder: '****',
  type: Skyflow.ElementType.PIN,
});

// This rule allows to match the value with pinElement.
const elementMatchRule = {
  type: Skyflow.ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
  params: {
    element: pinElement,
    error: 'PIN does not match',
  },
};

const confirmPinElement = collectContainer.create({
  label: 'Confirm PIN',
  placeholder: '****',
  type: Skyflow.ElementType.PIN,
  validations: [elementMatchRule],
});

// Mount elements on screen - errors will be shown if any of the validaitons fail.
pinElement.mount('#collectPIN');
confirmPinElement.mount('#collectConfirmPIN');

```
### Event Listener on Collect Elements


Helps to communicate with Skyflow elements / iframes by listening to an event

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
values of SkyflowElements will be returned in element state object only when `env` is  `DEV`,  else it is empty string i.e, '', but in case of CARD_NUMBER type element when the `env` is `PROD` for all the card types except AMEX, it will return first eight digits, for AMEX it will return first six digits and rest all digits in masked format.

##### Sample [code snippet](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/collect-element-listeners.html) for using listeners 
```javascript
// Create Skyflow client.
const skyflowClient = Skyflow.init({
  vaultID: '<VAULT_ID>',
  vaultURL: '<VAULT_URL>',
  getBearerToken: () => {},
  options: {
    env: Skyflow.Env.DEV,
  },
});

const container = skyflowClient.container(Skyflow.ContainerType.COLLECT);

const cardHolderName = container.create({
  table: 'pii_fields',
  column: 'first_name',
  type: Skyflow.ElementType.CARDHOLDER_NAME,
});
const cardNumber = container.create({
  table: 'pii_fields',
  column: 'primary_card.card_number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

cardNumber.mount('#cardNumberContainer');
cardHolderName.mount('#cardHolderNameContainer');

// Subscribing to CHANGE event, which gets triggered when element changes.
cardHolderName.on(Skyflow.EventName.CHANGE, state => {
  // Your implementation when Change event occurs.
  console.log(state);
});

// Subscribing to CHANGE event, which gets triggered when element changes.
cardNumber.on(Skyflow.EventName.CHANGE, state => {
  // Your implementation when Change event occurs.
  console.log(state);
});

```
##### Sample Element state object when `env` is `DEV`

```javascript
{
  elementType: 'CARDHOLDER_NAME',
  isEmpty: false,
  isFocused: true,
  isValid: false,
  value: 'John',
};
{
  elementType: 'CARD_NUMBER',
  isEmpty: false,
  isFocused: true,
  isValid: false,
  value: '4111-1111-1111-1111',
};
```
##### Sample Element state object when `env` is `PROD`

```javascript
{
  elementType: 'CARDHOLDER_NAME',
  isEmpty: false,
  isFocused: true,
  isValid: false,
  value: '',
};
{
  elementType: 'CARD_NUMBER',
  isEmpty: false,
  isFocused: true,
  isValid: false,
  value: '4111-1111-XXXX-XXXX',
};

```

### UI Error for Collect Elements

Helps to display custom error messages on the Skyflow Elements through the methods `setError` and `resetError` on the elements.

`setError(error: string)` method is used to set the error text for the element, when this method is triggered, all the current errors present on the element will be overridden with the custom error message passed. This error will be displayed on the element until `resetError()` is triggered on the same element.

`resetError()` method is used to clear the custom error message that is set using `setError`.

##### Sample code snippet for setError and resetError

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT);

const cardNumber = container.create({
  table: 'pii_fields',
  column: 'primary_card.card_number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

// Set custom error.
cardNumber.setError('custom error');

// Reset custom error.
cardNumber.resetError();
```

### Set and Clear value for Collect Elements (DEV ENV ONLY)

`setValue(value: string)` method is used to set the value of the element. This method will override any previous value present in the element.

`clearValue()` method is used to reset the value of the element.

`Note:` This methods are only available in DEV env for testing/developmental purposes and MUST NOT be used in PROD env.

##### Sample code snippet for setValue and clearValue

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT);

const cardNumber = container.create({
  table: 'pii_fields',
  column: 'primary_card.card_number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

// Set a value programatically.
cardNumber.setValue('4111111111111111');

// Clear the value.
cardNumber.clearValue();

```

---

# Securely collecting data client-side using Composable Elements

Composable Elements combine multiple Skyflow Elements in a single iframe, letting you create multiple Skyflow Elements in a single row. The following steps create a composable element and securely collect data through it.

### Step 1: Create a composable container

Create a container for the composable element using the `container(Skyflow.ContainerType)` method of the Skyflow client:

``` javascript
 const collectContainer = skyflow.container(Skyflow.ContainerType.COMPOSABLE,containerOptions);
```
The container requires an options object that contains the following keys:

1. `layout`: An array that indicates the number of rows in the container and the number of elements in each row. The index value of the array defines the number of rows, and each value in the array represents the number of elements in that row, in order.
  
    For example: `[2,1]` means the container has two rows, with two elements in the first row and one element in the second row.

    `Note`: The sum of values in the layout array should be equal to the number of elements created

2. `styles`: CSS styles to apply to the composable container.
3. `errorTextStyles`: CSS styles to apply if an error is encountered.

```javascript
const options = {
    layout: [2, 1],                           // Required
    styles: {                                 // Optional
        base: {
            border: '1px solid #DFE3EB',
            padding: '8px',
            borderRadius: '4px',
            margin: '12px 2px',
        },
    },
    errorTextStyles: {                       // Optional
        base: {
            color: 'red',
        },
    },
};
```

### Step 2: Create Composable Elements
Composable Elements use the following schema:

```javascript
const composableElement = {
  table: 'string',             // Required. The table this data belongs to.
  column: 'string',            // Required. The column this data belongs to.
  type: Skyflow.ElementType,   // Skyflow.ElementType enum.
  inputStyles: {},             // Optional. Styles applied to the form element.
  labelStyles: {},             // Optional. Styles for the label of the collect element.
  errorTextStyles: {},         // Optional. Styles for the errorText of the collect element.
  label: 'string',             // Optional. Label for the form element.
  placeholder: 'string',       // Optional. Placeholder for the form element.
  altText: 'string',           // (DEPRECATED) Initial value for the collect element.
  validations: [],             // Optional. Array of validation rules.
}
```
The `table` and `column` fields indicate which table and column in the vault the Element correspond to.

Note: Use dot-delimited strings to specify columns nested inside JSON fields (for example, `address.street.line1`).

All elements can be styled with  [JSS](https://cssinjs.org/?v=v10.7.1) syntax.

The `inputStyles` field accepts an object of CSS properties to apply to the form element in the following states:

* `base`: all variants inherit from these styles
* `complete`: applied when the Element has valid input
* `empty`: applied when the Element has no input
* `focus`: applied when the Element has focus
* `invalid`: applied when the Element has invalid input
* `cardIcon`: applied to the card type icon in CARD_NUMBER Element
* `copyIcon`: applied to copy icon in Elements when enableCopy option is true

An example of an `inputStyles` object:

```javascript
inputStyles: {
  base: {
    border: '1px solid #eae8ee',
    padding: '10px 16px',
    borderRadius: '4px',
    color: '#1d1d1d',
  },
  complete: {
    color: '#4caf50',
  },
  empty: {},
  focus: {},
  invalid: {
    color: '#f44336',
  },
  cardIcon: {
    position: 'absolute',
    left: '8px',
    bottom: 'calc(50% - 12px)',
  },
  copyIcon: {
    position: 'absolute',
    right: '8px',
  },
}
```
The `labelStyles` field supports the `base` and `focus` states.

An example `labelStyles` object:

```javascript
labelStyles: {
  base: {
    fontSize: '12px',
      fontWeight: 'bold'
  },
  focus: {
    color: '#1d1d1d'
  }
}
```
The `errorTextStyles` field only supports the `base` state, which appears when there is an error in the composable element.

An example `errorTextStyles` object:

```javascript
errorTextStyles: {
  base: {
    color: '#f44336'
  }
}
```
The JS SDK supports the following composable elements:

- `CARDHOLDER_NAME`
- `CARD_NUMBER`
- `EXPIRATION_DATE`
- `EXPIRATION_MONTH`
- `EXPIRATION_YEAR`
- `CVV`
- `INPUT_FIELD`
- `PIN`

`Note`: Only when the entered value in the below composable elements is valid, the focus shifts automatically. The element types are:
- `CARD_NUMBER`
- `EXPIRATION_DATE`
- `EXPIRATION_MONTH`
- `EXPIRATION_YEAR`

The `INPUT_FIELD` type is a custom UI element without any built-in validations. For information on validations, see [validations](#validations).

Along with the Composable Element definition, you can define additional options for the element:

```javascript
const options = {
    required: false,  		// Optional, indicates whether the field is marked as required. Defaults to 'false'
    enableCardIcon: true, 	// Optional, indicates whether card icon should be enabled (only applicable for CARD_NUMBER ElementType)
    format: String, 		// Optional, format for the element (only applicable currently for EXPIRATION_DATE ElementType),
    enableCopy: false 		// Optional, enables the copy icon in collect and reveal elements to copy text to clipboard. Defaults to 'false')
}
```

- `required`: Whether or not the field is marked as required. Defaults to `false`.
- `enableCardIcon`: Whether or not the icon is visible for the CARD_NUMBER element. Defaults to `true`.
- `format`: Format pattern for the element. Only applicable to EXPIRATION_DATE and EXPIRATION_YEAR element types.
- `enableCopy`: Whether or not the copy icon is visible in collect and reveal elements. Defaults to `false`.

The accepted `EXPIRATION_DATE` values are

- `MM/YY` (default)
- `MM/YYYY`
- `YY/MM`
- `YYYY/MM`


The accepted `EXPIRATION_YEAR` values are

- `YY` (default)
- `YYYY`


Once you define the Element object and options, add it to the container using the `create(element, options)` method:

```javascript
const composableElement = {
  table: 'string',             // Required, the table this data belongs to.
  column: 'string',            // Required, the column into which this data should be inserted.
  type: Skyflow.ElementType,   // Skyflow.ElementType enum.
  inputStyles: {},             // Optional, styles that should be applied to the form element.
  labelStyles: {},             // Optional, styles that will be applied to the label of the collect element.
  errorTextStyles: {},         // Optional, styles that will be applied to the errorText of the collect element.
  label: 'string',             // Optional, label for the form element.
  placeholder: 'string',       // Optional, placeholder for the form element.
  altText: 'string',           // (DEPRECATED) string that acts as an initial value for the collect element.
  validations: [],             // Optional, array of validation rules.
}

const options = {
  required: false,      // Optional, indicates whether the field is marked as required. Defaults to 'false'.
  enableCardIcon: true, // Optional, indicates whether card icon should be enabled (only applicable for CARD_NUMBER ElementType).
  format: String,       // Optional, format for the element (only applicable currently for EXPIRATION_DATE ElementType).
  enableCopy: false,    // Optional, enables the copy icon in collect and reveal elements to copy text to clipboard. Defaults to 'false').
};

const element = container.create(composableElement, options);
```

### Step 3: Mount Container to the DOM


To specify where the Elements are rendered on your page, create a placeholder `<div>` element with unique `id` attribute. Use this empty `<div>` placeholder to mount the composable container.

```javascript
<form>
  <div id="composableContainer"/>
  <br/>
  <div id="button-id"/>
  <button type="submit">Submit</button>
</form>
```
Use the composable container's `mount(domElement)` method to insert the container's Elements into the specified `<div>`. For instance, the following call inserts Elements into the `<div>` with the `id "#composableContainer"`.

```javacript
container.mount('#composableContainer');
```

### Step 4: Collect data from elements


When the form is ready to be submitted, call the container's `collect(options?)` method. The options parameter takes an object of optional parameters as follows:
- `tokens`: Whether or not tokens for the collected data are returned. Defaults to 'true'
- `additionalFields`: Non-PCI elements data to insert into the vault, specified in the records object format.
- `upsert`: To support upsert operations,  the table containing the data and a column marked as unique in that table.

```javascript
const options = {
  tokens: true,                             // Optional, indicates whether tokens for the collected data should be returned. Defaults to 'true'.
  additionalFields: {
    records: [
      {
        table: 'string',                   // Table into which record should be inserted.
        fields: {
          column1: 'value',                // Column names should match vault column names.
          // ...additional fields here.
        },
      },
      // ...additional records here.
    ],
  },                                      // Optional
  upsert: [                               // Upsert operations support in the vault                                    
    {
      table: 'string',                    // Table name
      column: 'value',                    // Unique column in the table
    },
  ],                                      // Optional
};
```

### End to end example of collecting data with Composable Elements

```javascript
// Step 1
const containerOptions = {
  layout: [2, 1],
  styles: {
    base: {
      border: '1px solid #eae8ee',
      padding: '10px 16px',
      borderRadius: '4px',
      margin: '12px 2px',
    },
  },
  errorTextStyles: {
    base: {
      color: 'red',
    },
  },
};

const composableContainer = skyflow.container(
  Skyflow.ContainerType.COMPOSABLE,
  containerOptions
);

// Step 2

const collectStylesOptions = {
  inputStyles: {
    base: {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '21px',
      width: '294px',
    },
  },
  labelStyles: {},
  errorTextStyles: {
    base: {},
  },
};

const cardHolderNameElement = composableContainer.create({
  table: 'pii_fields',
  column: 'first_name',
  ...collectStylesOptions,
  placeholder: 'Cardholder Name',
  type: Skyflow.ElementType.CARDHOLDER_NAME,
});

const cardNumberElement = composableContainer.create({
  table: 'pii_fields',
  column: 'card_number',
  ...collectStylesOptions,
  placeholder: 'Card Number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

const cvvElement = composableContainer.create({
  table: 'pii_fields',
  column: 'cvv',
  ...collectStylesOptions,
  placeholder: 'CVV',
  type: Skyflow.ElementType.CVV,
});

// Step 3
composableContainer.mount('#composableContainer'); // Assumes there is a div with id='#composableContainer' in the webpage.

// Step 4
composableContainer.collect({
  tokens: true,
});
```
### Sample Response:

```javascript
{
    "records": [
        {
            "table": "pii_fields",
            "fields": {
                "first_name": "63b5eeee-3624-493f-825e-137a9336f882",
                "card_number": "f3907186-e7e2-466f-91e5-48e12c2bcbc1",
                "cvv": "7baf5bda-aa22-4587-a5c5-412f6f783a19",
            }
        }
    ]
}
```
For information on validations, see [validations](#validations).

### Set an event listener on Composable Elements:

You can communicate with Skyflow Elements by listening to element events:

```javascript
element.on(Skyflow.EventName,handler:function)
```


The SDK supports four events:

- `CHANGE`: Triggered when the Element's value changes.
- `READY`: Triggered when the Element is fully rendered.
- `FOCUS`: Triggered when the Element gains focus.
- `BLUR`: Triggered when the Element loses focus.

The handler `function(state) => void` is a callback function you provide that's called when the event is fired with a state object that uses the following schema:

```javascript
state : {
  elementType: Skyflow.ElementType
  isEmpty: boolean 
  isFocused: boolean
  isValid: boolean
  value: string
}
```
`Note`: Events only include element values when in the state object when env is DEV. By default, value is an empty string.

### Example Usage of Event Listener on Composable Elements

```javascript
const containerOptions = {
  layout: [1],
  styles: {
    base: {
      border: '1px solid #eae8ee',
      padding: '10px 16px',
      borderRadius: '4px',
      margin: '12px 2px',
    }
  },
  errorTextStyles: {
    base: {
      color: 'red'
    }
  }
}

const composableContainer = skyflow.container(Skyflow.ContainerType.COMPOSABLE, containerOptions);

const cvv = composableContainer.create({
  table: 'pii_fields',
  column: 'primary_card.cvv',
  type: Skyflow.ElementType.CVV,
});

composableContainer.mount('#cvvContainer');

// Subscribing to CHANGE event, which gets triggered when element changes.
cvv.on(Skyflow.EventName.CHANGE, state => {
// Your implementation when Change event occurs.
console.log(state);
});
```

Sample Element state object when env is `DEV`

```javascript
{
    elementType: 'CVV'
    isEmpty: false
    isFocused: true
    isValid: false
    value: '411'
}
```

Sample Element state object when env is `PROD`

```javascript
{
    elementType: 'CVV'
    isEmpty: false
    isFocused: true
    isValid: false
    value: ''
}
```

### Update composable elements 
You can update composable element properties with the `update` interface.


The `update` interface takes the below object:
```javascript
const updateElement = {
  table: 'string',       // Optional. The table this data belongs to.
  column: 'string',      // Optional. The column this data belongs to.
  inputStyles: {},       // Optional. Styles applied to the form element.
  labelStyles: {},       // Optional. Styles for the label of the element.
  errorTextStyles: {},   // Optional. Styles for the errorText of element.
  label: 'string',       // Optional. Label for the form element.
  placeholder: 'string', // Optional. Placeholder for the form element.
  validations: [],       // Optional. Array of validation rules.
};
```

Only include the properties that you want to update for the specified composable element. 

Properties your provided when you created the element remain the same until you explicitly update them.

`Note`: You can't update the `type` property of an element.

### End to end example
```javascript
const containerOptions = { layout: [2, 1] };

// Create a composable container. 
const composableContainer = skyflow.container(
  Skyflow.ContainerType.COMPOSABLE,
  containerOptions
);

const stylesOptions = {
  inputStyles: {
    base: {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '21px',
      width: '294px',
    },
  },
  labelStyles: {},
  errorTextStyles: {
    base: {},
  },
};

// Create composable elements.
const cardHolderNameElement = composableContainer.create({
  table: 'pii_fields',
  column: 'first_name',
  ...stylesOptions,
  placeholder: 'Cardholder Name',
  type: Skyflow.ElementType.CARDHOLDER_NAME,
});


const cardNumberElement = composableContainer.create({
  table: 'pii_fields',
  column: 'card_number',
  ...stylesOptions,
  placeholder: 'Card Number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

const cvvElement = composableContainer.create({
  table: 'pii_fields',
  column: 'cvv',
  ...stylesOptions,
  placeholder: 'CVV',
  type: Skyflow.ElementType.CVV,
});

// Mount the composable container.
composableContainer.mount('#compostableContainer'); // Assumes there is a div with id='#composableContainer' in the webpage.

// ...

// Update validations property on cvvElement.
cvvElement.update({
  validations: [{
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      max: 3,
      error: 'cvv must be 3 digits',
    },
  }]
})

// Update label, placeholder properties on cardHolderNameElement.
cardHolderNameElement.update({
  label: 'CARDHOLDER NAME',
  placeholder: 'Eg: John'
});

// Update table, column, inputStyles properties on cardNumberElement.
cardNumberElement.update({
  table:'cards',
  column:'card_number',
  inputStyles:{
    base:{
      color:'blue'
    }
  }
});


```
### Set an event listener on a composable container
Currently, the SDK supports one event:
- `SUBMIT`: Triggered when the `Enter` key is pressed in any container element.

The handler `function(void) => void` is a callback function you provide that's called when the `SUBMIT' event fires.

### Example
```javascript
const containerOptions = { layout: [1] }

// Creating a composable container.
const composableContainer = skyflow.container(Skyflow.ContainerType.COMPOSABLE, containerOptions);

// Creating the element.
const cvv = composableContainer.create({
  table: 'pii_fields',
  column: 'primary_card.cvv',
  type: Skyflow.ElementType.CVV,
});

// Mounting the container.
composableContainer.mount('#cvvContainer');

// Subscribing to the `SUBMIT` event, which gets triggered when the user hits `enter` key in any container element input.
composableContainer.on(Skyflow.EventName.SUBMIT, ()=> {
  // Your implementation when the SUBMIT(enter) event occurs.
  console.log('Submit Event Listener is being Triggered.');
});
```


---
# Securely revealing data client-side
-  [**Retrieving data from the vault**](#retrieving-data-from-the-vault)
-  [**Using Skyflow Elements to reveal data**](#using-skyflow-elements-to-reveal-data)
-  [**UI Error for Reveal Elements**](#ui-error-for-reveal-elements)
-  [**Set token for Reveal Elements**](#set-token-for-reveal-elements)
-  [**Set and clear altText for Reveal Elements**](#set-and-clear-alttext-for-reveal-elements)

## Retrieving data from the vault

For non-PCI use-cases, retrieving data from the vault and revealing it in the browser can be done either using the SkyflowID's, unique column values or tokens as described below

- ### Using Skyflow tokens
    In order to retrieve data from your vault using tokens that you have previously generated for that data, you can use the `detokenize(records)` method. The records parameter takes a JSON object that contains `records` to be fetched as shown below.

```javascript
const records = {
  records: [
    {
      token: 'string', // Token for the record to be fetched.
      redaction: RedactionType // Optional. Redaction to be applied for retrieved data.
    },
  ],
};

Note: If you do not provide a redaction type, RedactionType.PLAIN_TEXT is the default.

skyflow.detokenize(records);
```
An [example](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/pure-js.html) of a detokenize call: 

```javascript
skyflow.detokenize({
  records: [
    {
      token: '131e70dc-6f76-4319-bdd3-96281e051051',
    },
    {
     token: '1r434532-6f76-4319-bdd3-96281e051051',
     redaction: Skyflow.RedactionType.MASKED
    }
  ],
});
```

The sample response:
```javascript
{
  "records": [
    {
      "token": "131e70dc-6f76-4319-bdd3-96281e051051",
      "value": "1990-01-01",
    },
    {
     "token": "1r434532-6f76-4319-bdd3-96281e051051",
     "value": "xxxxxxer",
   }
  ]
}
```

- ### Using Skyflow ID's or Unique Column Values
    You can retrieve data from the vault with the get(records) method using either Skyflow IDs or unique column values.

    The records parameter accepts a JSON object that contains an array of either Skyflow IDs or unique column names and values.

    Note: You can use either Skyflow IDs  or unique values to retrieve records. You can't use both at the same time.

    Skyflow.RedactionTypes accepts four values:
    - `PLAIN_TEXT`
    - `MASKED`
    - `REDACTED`
    - `DEFAULT`

    You must apply a redaction type to retrieve data.

#### Schema (Skyflow IDs)

```javascript
data = {
 records: [
   {
     ids: ["SKYFLOW_ID_1", "SKYFLOW_ID_2"],      // List of skyflow_ids for the records to fetch.
     table: "NAME_OF_SKYFLOW_TABLE",             // Name of table holding the records in the vault.
     redaction: Skyflow.RedactionType,           // Redaction type to apply to retrieved data.
   },
 ],
};
```
#### Schema (Unique column values)

```javascript
data = {
 records: [
   {
     table: "NAME_OF_SKYFLOW_TABLE",        // Name of table holding the records in the vault.
     columnName: "UNIQUE_COLUMN_NAME",      // Unique column name in the vault.
     columnValues: [                        // List of given unique column values. 
       "<COLUMN_VALUE_2>",
       "<COLUMN_VALUE_3>",
     ],                                     // Required when specifying a unique column
     redaction: Skyflow.RedactionType,      // Redaction type applies to retrieved data.

   },
 ],
};
```
[Example usage (Skyflow IDs)](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/get-pure-js.html)

```javascript
skyflow.get({
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
Example response

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
[Example usage (Unique column values)](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/get-pure-js.html)

```javascript
skyflow.get({
 records: [
   {
   table: "cards",
   redaction: RedactionType.PLAIN_TEXT,
   columnName: "card_id",
   columnValues: ["123", "456"],
  }
 ],
});
```
Sample response: 
```javascript
{
   "records": [
       {
           "fields": {
               "card_id": "123",
               "expiry_date": "11/35",
               "fullname": "myname",
               "id": "f8d2-b557-4c6b-a12c-c5ebfd9"
           },
           "table": "cards"
       },
       {
           "fields": {
               "card_id": "456",
               "expiry_date": "10/23",
               "fullname": "sam",
               "id": "da53-95d5-4bdb-99db-8d8c5ff9"
           },
           "table": "cards"
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
  token: 'string',     // Required, token of the data being revealed.
  inputStyles: {},     // Optional, styles to be applied to the element.
  labelStyles: {},     // Optional, styles to be applied to the label of the reveal element.
  errorTextStyles: {}, // Optional, styles that will be applied to the errorText of the reveal element.
  label: 'string',     // Optional, label for the form element.
  altText: 'string',   // Optional, string that is shown before reveal, will show token if altText is not provided.
  redaction: RedactionType, //Optional, Redaction Type to be applied to data, RedactionType.PLAIN_TEXT will be applied if not provided.
};
```

Note: If you don't provide a redaction type, RedactionType.PLAIN_TEXT will apply by default.

The `inputStyles`, `labelStyles` and  `errorTextStyles` parameters accepts a styles object as described in the [previous section](#step-2-create-a-collect-element) for collecting data. But for reveal element, `inputStyles` accepts only `base` variant and `copyIcon` style object. 

An example of a inputStyles object:

```javascript
inputStyles: {
  base: {
    color: '#1d1d1d',
  },
  copyIcon: {
    position: 'absolute',
    right: '8px',
    top: 'calc(50% - 10px)',
  },
},
```

An example of a labelStyles object:

```javascript
labelStyles: {
  base: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
},
```

An example of a errorTextStyles object:

```javascript
errorTextStyles: {
  base: {
    color: '#f44336',
  },
},
```

Along with RevealElementInput, you can define other options in the RevealElementOptions object as described below: 
```js
const options = {
  enableCopy: false,    // Optional, enables the copy icon to reveal elements to copy text to clipboard. Defaults to 'false').
 format: String,        // Optional, format for the element 
 translation: {}        // Optional, indicates the allowed data type value for format. 
}
```

`format`: A string value that indicates how the reveal element should display the value, including placeholder characters that map to keys `translation` If `translation` isn't specified to any character in the `format` value is considered as a string literal.

`translation`: An object of key value pairs, where the key is a character that appears in `format` and the value is a simple regex pattern of acceptable inputs for that character. Each key can only appear once. Defaults to `{ ‘X’: ‘[0-9]’ }`.

**Reveal Element Options examples:**
Example 1
```js
const revealElementInput = {
 token: '<token>' 
};

const options = {
  format: '(XXX) XXX-XXXX',
  translation: { 'X': '[0-9]'} 
};

const revealElement = revealContainer.create(revealElementInput,options);
```

Value from vault: "1234121234"
Revealed Value displayed in element: "(123) 412-1234"

Example 2:
```js
const revealElementInput = {
 token: '<token>' 
};

const options = {
  format: 'XXXX-XXXXXX-XXXXX',
  translation: { 'X': '[0-9]' } 
};

const revealElement = revealContainer.create(revealElementInput,options);
```

Value from vault: "374200000000004"
Revealed Value displayed in element: "3742-000000-00004"

Once you've defined a Skyflow Element, you can use the `create(element)` method of the container to create the Element as shown below: 

```javascript
const element = container.create(revealElement)
```

### Step 3: Mount Elements to the DOM

Elements used for revealing data are mounted to the DOM the same way as Elements used for collecting data. Refer to Step 3 of the [section above](#step-3-mount-elements-to-the-dom).


### Step 4: Reveal data
When the sensitive data is ready to be retrieved and revealed, call the `reveal()` method on the container as shown below: 

```javascript
container
  .reveal()
  .then(data => {
    // Handle success.
  })
  .catch(err => {
    // Handle error.
  });
```


### End to end example of all steps

**[Sample Code:](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/skyflow-elements.html)**
```javascript
// Step 1.
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL);

// Step 2.
const cardNumberElement = container.create({
  token: 'b63ec4e0-bbad-4e43-96e6-6bd50f483f75',
  inputStyles: {
    base: {
      color: '#1d1d1d',
    },
  },
  labelStyles: {
    base: {
      fontSize: '12px',
    },
  },
  errorTextStyles: {
    base: {
      color: '#f44336',
    },
  },
  label: 'card_number',
  altText: 'XXXX XXXX XXXX XXXX',
  redaction: SKyflow.RedactionType.MASKED
});

const cvvElement = container.create({
  token: '89024714-6a26-4256-b9d4-55ad69aa4047',
  inputStyles: {
    base: {
      color: '#1d1d1d',
    },
  },
  label: 'cvv',
  altText: 'XXX',
});

const expiryDate= container.create({
 token: 'a4b24714-6a26-4256-b9d4-55ad69aa4047',
 inputStyles: {
   base: {
     color: '#1d1d1d',
   },
 },
 label: 'expiryDate',
 altText: 'MM/YYYY',
});
// Step 3.
cardNumberElement.mount('#cardNumber'); // Assumes there is a placeholder div with id='cardNumber' on the page
cvvElement.mount('#cvv');               // Assumes there is a placeholder div with id='cvv' on the page
expiryDate.mount('#expiryDate');        // Assumes there is a placeholder div with id='expiryDate' on the page

// Step 4.
container
  .reveal()
  .then(data => {
    // Handle success.
  })
  .catch(err => {
    // Handle error.
  });
```

The response below shows that some tokens assigned to the reveal elements get revealed successfully, while others fail and remain unrevealed.

### Sample Response

```
{
  "success": [
     {
     "token": "b63ec4e0-bbad-4e43-96e6-6bd50f483f75",
     "value": "xxxxxxxxx4163"
   },
   {
     "token": "a4b24714-6a26-4256-b9d4-55ad69aa4047",
     "value": "12/2098"
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

`setError(error: string)` method is used to set the error text for the element, when this method is triggered, all the current errors present on the element will be overridden with the custom error message passed. This error will be displayed on the element until `resetError()` is triggered on the same element.

`resetError()` method is used to clear the custom error message that is set using `setError`.

##### Sample code snippet for setError and resetError

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL);

const cardNumber = container.create({
  token: '89024714-6a26-4256-b9d4-55ad69aa4047',
});

// Set custom error.
cardNumber.setError('custom error');

// Reset custom error.
cardNumber.resetError();
```
### Set token for Reveal Elements

The `setToken(value: string)` method can be used to set the token of the Reveal Element. If no altText is set, the set token will be displayed on the UI as well. If altText is set, then there will be no change in the UI but the token of the element will be internally updated.

##### Sample code snippet for setToken
```javascript
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL);

const cardNumber = container.create({
  altText: 'Card Number',
});

// Set token.
cardNumber.setToken('89024714-6a26-4256-b9d4-55ad69aa4047');
```
### Set and Clear altText for Reveal Elements
The `setAltText(value: string)` method can be used to set the altText of the Reveal Element. This will cause the altText to be displayed in the UI regardless of whether the token or value is currently being displayed.

`clearAltText()` method can be used to clear the altText, this will cause the element to display the token or actual value of the element. If the element has no token, the element will be empty.
##### Sample code snippet for setAltText and clearAltText

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.REVEAL);

const cardNumber = container.create({
  token: '89024714-6a26-4256-b9d4-55ad69aa4047',
});

// Set altText.
cardNumber.setAltText('Card Number');

// Clear altText.
cardNumber.clearAltText();

```

## Using Skyflow File Element to upload a file

You can upload binary files to a vault using the Skyflow File Element. Use the following steps to securely upload a file.
### Step 1: Create a container

Create a container for the form elements using the container(Skyflow.ContainerType) method of the Skyflow client:

```javascript
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT)
```

### Step 2: Create a File Element

Skyflow Collect Elements are defined as follows: 

```javascript
const collectElement =  {
  type: Skyflow.ElementType.FILE_INPUT,   // Skyflow.ElementType enum.
  table: 'string',             // The table this data belongs to.
  column: 'string',            // The column into which this data should be inserted.
  skyflowID: 'string',         // The skyflow_id of the record.
  inputStyles: {},             // Optional, styles that should be applied to the form element.
  labelStyles: {},             // Optional, styles that will be applied to the label of the collect element.
  errorTextStyles:{},          // Optional, styles that will be applied to the errorText of the collect element.
}
```
The `table` and `column` fields indicate which table and column the Element corresponds to. 

`skyflowID` indicates the record that stores the file.

**Notes**: 
- `skyflowID` is required while creating File element
- Use period-delimited strings to specify columns nested inside JSON fields (e.g. `address.street.line1`).

 ## Step 3: Mount elements to the DOM

To specify where to render Elements on your page, create placeholder `<div>` elements with unique `id` tags. For instance, the form below has an empty div with a unique id as a placeholder for a Skyflow Element. 

```html
<form>
  <div id="file"/>
  <br/>
  <button type="submit">Submit</button>
</form>
```

Now, when the `mount(domElement)` method of the Element is called, the Element is inserted in the specified div. For instance, the call below inserts the Element into the div with the id "#file".  

```javascript
element.mount('#file');
```
Use the `unmount` method to reset a Collect Element to its initial state.

```javascript
element.unmount();
```
## Step 4: Collect data from elements

When the file is ready to be uploaded, call the `uploadFiles()` method on the container object.

```javascript
container.uploadFiles();
```
### File upload limitations:

- Only non-executable file are allowed to be uploaded.
- Files must have a maximum size of 32 MB
- File columns can't enable tokenization, redaction, or arrays.
- Re-uploading a file overwrites previously uploaded data.
- Partial uploads or resuming a previous upload isn't supported.

### End-to-end file upload

```javascript
// Step 1.
const container = skyflowClient.container(Skyflow.ContainerType.COLLECT);

// Step 2.
const element = container.create({
  table: 'pii_fields',
  column: 'file',
  skyflowID: '431eaa6c-5c15-4513-aa15-29f50babe882',
  inputstyles: {
    base: {
      color: '#1d1d1d',
    },
  },
  labelStyles: {
    base: {
      fontSize: '12px',
      fontWeight: 'bold',
    },
  },
  errorTextStyles: {
    base: {
      color: '#f44336',
    },
  },
  type: Skyflow.ElementType.FILE_INPUT,
});

// Step 3.
element.mount('#file'); // Assumes there is a div with id='#file' in the webpage.

// Step 4.
container.uploadFiles();
```

**Sample Response :**
```javascript
{
    fileUploadResponse: [
        {
            "skyflow_id": "431eaa6c-5c15-4513-aa15-29f50babe882"
        }
    ]
}
```
#### File upload with additional elements

```javascript
// Create collect Container.
const collectContainer = skyflow.container(Skyflow.ContainerType.COLLECT);

// Create collect elements.
const cardNumberElement = collectContainer.create({
  table: 'newTable',
  column: 'card_number',
  inputstyles: {
    base: {
      color: '#1d1d1d',
    },
  },
  labelStyles: {
    base: {
      fontSize: '12px',
      fontWeight: 'bold',
    },
  },
  errorTextStyles: {
    base: {
      color: '#f44336',
    },
  },
  placeholder: 'card number',
  label: 'Card Number',
  type: Skyflow.ElementType.CARD_NUMBER,
});

const fileElement = collectContainer.create({
  table: 'newTable',
  column: 'file',
  skyflowID: '431eaa6c-5c15-4513-aa15-29f50babe882',
  inputstyles: {
    base: {
      color: '#1d1d1d',
    },
  },
  labelStyles: {
    base: {
      fontSize: '12px',
      fontWeight: 'bold',
    },
  },
  errorTextStyles: {
    base: {
      color: '#f44336',
    },
  },
  type: Skyflow.ElementType.FILE_INPUT,
});

// Mount the elements.
cardNumberElement.mount('#collectCardNumber');
fileElement.mount('#collectFile');

// Collect and upload methods.
collectContainer.collect({});
collectContainer.uploadFiles();

```
**Sample Response for collect():**
```javascript
{
  "records": [
    {
      "table": "newTable",
      "fields": {
        "card_number": "f3907186-e7e2-466f-91e5-48e12c2bcbc1",
      }
    }
  ]
}
```
**Sample Response for file uploadFiles() :**
```javascript
{
    "fileUploadResponse": [
        {
            "skyflow_id": "431eaa6c-5c15-4513-aa15-29f50babe882"
        }
    ]
}
```

---
# Securely deleting data client-side
-  [**Deleting data from the vault**](#deleting-data-from-the-vault)

## Deleting data from the vault

To delete data from the vault, use the `delete(records, options?)` method of the Skyflow client. The `records` parameter takes an array of records to delete in the following format. The `options` parameter is optional and takes an object of deletion parameters. Currently, there are no supported deletion parameters.

```javascript
const records = [
  {
    id: "<SKYFLOW_ID_1>", // skyflow id of the record to delete
    table: "<TABLE_NAME>" // Table from which the record is to be deleted
  },
  {
    // ...additional records here
  },
],

skyflowClient.delete(records);
```

An [example](https://github.com/skyflowapi/skyflow-js/blob/master/samples/using-script-tag/delete-pure-js.html) of delete call:

```javascript
skyflowClient.delete({
  records: [
    {
      id: "29ebda8d-5272-4063-af58-15cc674e332b",
      table: "cards",
    },
    {
      id: "d5f4b926-7b1a-41df-8fac-7950d2cbd923",
      table: "cards",
    }
  ],
});
```

A sample response:

```json
{
  "records": [
    {
     "skyflow_id": "29ebda8d-5272-4063-af58-15cc674e332b",
     "deleted": true,
    },
    {
     "skyflow_id": "29ebda8d-5272-4063-af58-15cc674e332b",
     "deleted": true,
    }
  ]
}
```


## Reporting a Vulnerability

If you discover a potential security issue in this project, please reach out to us at security@skyflow.com. Please do not create public GitHub issues or Pull Requests, as malicious actors could potentially view them.
