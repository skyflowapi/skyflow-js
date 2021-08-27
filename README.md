# skyflow-js
Skyflow’s Javascript SDK can be used to securely collect, tokenize, and reveal sensitive data in the browser without exposing your front-end infrastructure to sensitive data. 

---

# Table of Contents
- [**Including Skyflow.js**](#Including-Skyflowjs) 
- [**Initializing Skyflow.js**](#Initializing-Skyflowjs)
- [**Securely collecting data client-side**](#Securely-collecting-data-client-side)
- [**Securely revealing data client-side**](#Securely-revealing-data-client-side)

---

# Including Skyflow.js
Using script tag

```html
<script src="https://js.skyflow.com/v1"></script>
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
   getBearerToken: helperFunc  //helper function that retrieves a Skyflow bearer token from your backend
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
      if (Http.readyState == 4 && Http.status == 200) {
        const response = JSON.parse(Http.responseText);
        resolve(response.accessToken)
      }
    };
    const url = "https://api.acmecorp.com/skyflowToken";
    Http.open("GET", url);
    Http.send();
  })

}

```

---

# Securely collecting data client-side
-  [**Inserting data into the vault**](#inserting-data-into-the-vault)
-  [**Using Skyflow Elements to collect data**](#using-skyflow-elements-to-collect-data)

## Inserting data into the vault

To insert data into the vault from the browser, use the `insert(records, options?)` method of the Skyflow client. The `records` parameter takes a JSON object of the records to be inserted in the below format. The `options` parameter takes a dictionary of optional parameters for the insertion. See below: 

```javascript
var records = {
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

var options = {
  tokens: true  //indicates whether or not tokens should be returned for the inserted data. Defaults to 'true'  
}

skyflowClient.insert(records, options={})
```

 

An example of an insert call: 
```javascript
skyflowClient.insert([
  {
    "table": "cards",
    "fields": {
      "cardNumber": "41111111111",
      "cvv": "123",
    }
  }]);
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
var collectElement =  {
   table: "string",             //the table this data belongs to
   column: "string",            //the column into which this data should be inserted
   styles: {},                  //optional styles that should be applied to the form element
   label: "string",             //optional label for the form element
   placeholder: "string",       //optional placeholder for the form element
   type: Skyflow.ElementType    //Skyflow.ElementType enum
}
```
The `table` and `column` fields indicate which table and column in the vault the Element corresponds to. **Note**:  Use dot delimited strings to specify columns nested inside JSON fields (e.g. `address.street.line1`). 

The `styles` field accepts a style object which consists of CSS properties that should be applied to the form element in the following states:
- `base`: all other variants inherit from these styles
- `complete`: applied when the Element has valid input
- `empty`: applied when the Element has no input
- `focus`: applied when the Element has focus
- `invalid`: applied when the Element has invalid input

Styles are specified with [JSS](https://cssinjs.org/?v=v10.7.1). 

An example of a styles object:
```javascript
styles:{
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

Finally, the `type` field takes a Skyflow ElementType. Each type applies the appropriate regex and validations to the form element. There are currently 4 types:
- `CARDHOLDER_NAME`
- `CARD_NUMBER`
- `EXPIRATION_DATE`
- `CVV`

Once the Element object has been defined, add it to the container using the `create(element, options)` method as shown below. The `element` param takes a Skyflow Element object as defined above and the `options` parameter takes a dictionary of optional parameters as described below: 

```javascript
var collectElement =  {
   table: "string",             //the table this data belongs to
   column: "string",            //the column into which this data should be inserted
   styles: {},                  //optional styles that should be applied to the form element
   label: "string",             //optional label for the form element
   placeholder: "string",       //optional placeholder for the form element
   type: Skyflow.ElementType    //Skyflow.ElementType enum
}

var options = {
  required: false  //indicates whether the field is marked as required. Defaults to 'false'
}

const element = container.create(element, options)
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


### Step 4: Collect data from Elements

When the form is ready to be submitted, call the `collect(options?)` method on the container object. The `options` parameter takes a dictionary of optional parameters as shown below: 

```javascript
var options = {
  tokens: true  //indicates whether tokens for the collected data should be returned. Defaults to 'true'
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
  styles: {
      base: {
        color: "#1d1d1d",
      },
    },
  placeholder: "Card Number",
  label: "card_number",
  type: Skyflow.ElementType.CARD_NUMBER
})

// Step 3
element.mount("#cardNumber")  //assumes there is a div with id="#cardNumber" in the webpage

// Step 4
container.collect()
```

**Sample Response :**
```javascript
{
  "records": [
    {
      "table": "cards",
      "fields": {
        "cardNumber": "f3907186-e7e2-466f-91e5-48e12c2bcbc1"
      }
    }
  ]
}
```

---


# Securely revealing data client-side
-  [**Retrieving data from the vault**](#retrieving-data-from-the-vault)
-  [**Using Skyflow Elements to reveal data**](#using-skyflow-elements-to-reveal-data)

## Retrieving data from the vault

For non-PCI use cases, to retrieve data from the vault and reveal it in the browser, use the `get(records)` method of the Skyflow client. The `records` parameter takes an array of records to be fetched as shown below. 

```javascript
var records = [
  { 
    id: "string",                       //Token for the record to be fetched
    redaction: Skyflow.RedactionType    //redaction to be applied to the retrieved data
  }
]

skyflow.get(records)
```

There are 4 accepted values in Skyflow.RedactionTypes:
- `PLAIN_TEXT`
- `MASKED`
- `REDACTED`
- `DEFAULT`

An example of a get call: 

```javascript
skyflow.get([
  {
    id: "131e70dc-6f76-4319-bdd3-96281e051051",
    redaction: Skyflow.RedactionType.PLAIN_TEXT
  }
])
```

The sample response:
```javascript
{
  "records": [
    {
      "id": "131e70dc-6f76-4319-bdd3-96281e051051",
      "date_of_birth": "1990-01-01",
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
var revealElement = {
  id: "string",                       //token of the data being revealed 
  redaction: Skyflow.RedactionType,   //redaction type to be applied to the data when revealed
  styles: {},                         //optional styles to be applied to the element
  label: "string"                     //label for the form element
}
```

The `styles` parameter accepts a styles object as described in the [previous section](#step-2-create-a-collect-element) for collecting data. For a list of acceptable RedactionTypes, see the [section above](#Retrieving-data-from-the-vault).

Once you've defined a Skyflow Element, you can use the `create(element)` method of the container to create the Element as shown below: 

```javascript
const element = container.create(revealElement, options={})
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
  id: "b63ec4e0-bbad-4e43-96e6-6bd50f483f75",
  redaction: Skyflow.RedactionType.DEFAULT,
  styles: {
      base: {
        color: "#1d1d1d",
      },
    },
  label: "card_number",
})

const cvvElement = container.create({             
  id: "89024714-6a26-4256-b9d4-55ad69aa4047",
  redaction: Skyflow.RedactionType.DEFAULT,
  styles: {
      base: {
        color: "#1d1d1d",
      },
    },
  label: "cvv",
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
      "id": "b63ec4e0-bbad-4e43-96e6-6bd50f483f75"
    }
  ],
 "errors": [
    {
       "id": "89024714-6a26-4256-b9d4-55ad69aa4047",
       "error": {
         "code": 404,
         "description": "Tokens not found for 89024714-6a26-4256-b9d4-55ad69aa4047"
       } 
   }   
  ]
}
```