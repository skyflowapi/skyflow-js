# Skyflow-JS 
---
The SDK for JavaScript is provided as a JavaScript file with support included for a set of services. This file is typically loaded into browser scripts using a ```<script>``` tag that references the hosted SDK package. 

# Table of Contents
- **Install** 
- [**Skyflow Client Initialization**](#skyflow-client)
- **Insert records into to vault**
    - [without using skyflow elements](#without-using-skyflow-elements)
    - [using skyflow elements](#using-skyflow-elements)
- **Reveal records from the vault**
    - [without using skyflow elements](#without-using-skyflow-element)
    - [using skyflow elements](#using-skyflow-element)

## How To Install
---
### In the Browser
- To use the SDK in the browser, simply add the following script tag to your HTML pages:
```<script src="https://skyflow-js.s3-us-west-2.amazonaws.com/skyflow.js"></script>```

## Skyflow Client
----
To get started, create a **skyflow client.**
you have to set your **vault id, vault url** and **getAccessToken.**
```
const skyflow = new window.Skyflow.init({
   vaultId: <vaultId>, 
   vaultURL: <vaultURL>, 
   getAccessToken: <getAccessToken callback>
})
```
To give SDK access to the skyflow apis, create a function in consumer application that requests an accessToken from their backend and provide it in getAccessToken callback during skyflow intialization
Whenever SDK needs to interact with the skyflow apis, it checks if the accessToken is expired or not and calls getAccessToken accordingly

**Sample implementation of getAccessToken**
```
const getAccessToken = () => {
        // fetch access token from your backend using service account
        return Promise.resolve(token)
}
```
---
# Two ways to insert records into the vault
-  [**without using skyflow elements**](#without-using-skyflow-elements), we use **insert(records,options)** method
-  [**using skyflow elements**](#using-skyflow-elements), we use **collect(options)**,  uses iframe elements

## without using skyflow elements
    insert(records, options?): Promise
- to insert records into the vault (**use this method, if you want to directly insert into the vault without using skyflow elements**)

```skyflow.insert(records, options)```
```
records object 
{
    table: string;
    fields: Record<string, string>
}

options object
{
    tokens?: boolean // if not given, default value is true
}
```
**response contains tokens if the tokens is set as true in options param, otherwise it contains skyflowId only.**

Example:
```
skyflow.insert({
 "records": [
   {
     "table": "patients",
     "fields": {
       "race": "AMERICAN_INDIAN_OR_ALASKAN_NATIVE",
       "ethnicity": "NON_HISPANIC_OR_LATINO",
       "sex": "OTHER",
     }
   },
   {
     "table": "metadata_records",
     "fields": {
       "created_timestamp": "1234567890",
       "status": {
         "state": "UNSUBMITTED"
       }
     }
   }
 ]
}, {
    tokens: true
}
)
```

**Response :**
```
 {
 "records": [
    {
     "table": "patients",
     "fields":{
           "race": "f3907186-e7e2-466f-91e5-48e12c2bcbc1",
           "ethnicity": "1989cb56-63da-4482-a2df-1f74cd0dd1a5",
           "sex": "25f21e24-7c42-47dd-b4f0-3c07b7d5be45"
      }
    },
   {
     "table": "metadata_records",
     "fields":{
         "created_timestamp": "3acfb577-e10b-462a-9f5e-adc0bd4c25a4",
         "status": {
            "state": "5e843cf2-ee71-42a9-b8d2-4c583160a77e"
          }
      }
    }
  ]
}
```

## Using Skyflow elements

    collect(options?) : Promise

- Create a container if you want to insert data into the vault using **skyflow elements**
### container(type): Container

- **type : "COLLECT"** to create collect type container object
### Steps to use container

###### First step : create collect container
```const container = skyflow.container("COLLECT");``` 
- Use this container instance to create and manage a group of individual skyflow element instances.
- Using the type option can create a respective container, type is **"COLLECT"** here for collect container

###### Second step :  create skyflow elements using this container instance
```const element = container.create(collectElement, options)```
```
collectElement object
{
    table: string, // actual table name in the vault 
    column: string; // actual field name in the table
    styles?: SkyflowStyle;
    label?: string;
    placeholder?: string;
    type: skyflowElementType                     
}

options object
 {
    required?: boolean // default value is false
 }
```
```Note```:  column for nested JSON fields can be given by dot separated strings

```
        column: "address.street.line1"
```
  	
#### SkyflowElementType
Currently we have 4 types.
- `cardHolderName`
- `cardNumber`
- `expiryDate`
- `cvv`
Each type has a default regex and validations.

#### SkyflowStyle
Style object, which consists of CSS properties nested under objects for any of the following variants:
- base, all other variants inherit from these styles
- complete, applied when the Element has valid input
- empty, applied when the Element has no customer input
- focus, applied when the Element has
- invalid, applied when the Element has invalid input

```Note```: If no variants are given, default styles are applied
Example style object:
```
styles:{
    base: {
      border: "1px solid #eae8ee",
      padding: "10px 16px",
      "border-radius": "4px",
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

###### Third step :  Create empty div elements
- We need to create empty div elements to specify where our iframe elements will be rendered
- Sample code demonstrates the use of div elements-
In below form we have four div element id's such as #cardNumber, #expireDate , #pin and #CVV and these are the domElement value in **#4 step**

```
<div class="container">
    <h2>  User Data </h2>
    <form>
      <div id="cardNumber">
        
      </div><br/>
      <div id="expireDate">
        
      </div>  <br/>  
      <div id="cvv">
      
      </div> <br/>  
      <div id="pin">
      
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
</div>
```

###### Fourth step :  Attach your Element to the DOM : 
```element.mount(domElement): void```
- method attaches your Element to the DOM
- **domElement** here are id such as pin in **#3 step**

### Basic usage of all steps
```
 
const container = skyflow.container('COLLECT') //step 1

//create input field using container
const element = container.create({             // step 2
  table: "cards",
  column: "pin",
  styles: {
      base: {
        color: "#1d1d1d",
      },
    },
  placeholder: "pin",
  label: "card_pin",
  type: "pin"
})

// renders the skyflow element in the div element of id equals pin
element.mount("#pin")                          //step 4
```
### container.collect(options) method 
- called on the **5th step** to perform the respective operations.

#### collect(options?) : Promise

```
options object
{
    tokens?: boolean // if not given, default value is true
}
```

```
container
  .collect()
  .then((res) => {
    //handle success
  })
  .catch((e) => {
    //handle error
  });
```
- Container will collect all the values from the elements that are created and sends a tokenize request to the vault which returns tokens in the respone

**Sample Response :**
```
{
  "records": [
    {
      "table": "cards",
      "fields": {
        "pin": "f3907186-e7e2-466f-91e5-48e12c2bcbc1"
      }
    }
  ]
}
```

---
---
# Two ways to reveal records from the vault
- [**without using skyflow elements**](#without-using-skyflow-element), we use **get(records,options?)** 
- [**using skyflow elements**](#using-skyflow-elements), we use **reveal(options?)**, uses iframe elements

### without using skyflow element
- **get(records,options?)** is called on skyflow instance
- records is an array of objects, options are optional
- pass multiple token id and redaction policy to get the records respectively
- Method Syntax
    ```
   get(records, options?): Promise
   where,
    records:
    {
        id: string, //token
        redaction: string
    },
    options are optional
    ```
- interacts directly with the vault to get the field value

#### Code Usage
```
skyflow.get([{
	id: "131e70dc-6f76-4319-bdd3-96281e051051", //field-level token	
	redaction: PLAIN_TEXT
},{
	id: "96281e051051-6f76-4319-bdd3-131e7", //field-level token	
	redaction: PLAIN_TEXT
}])
```
```
// Sample Response
{
  "records": [
    {
      "id": "131e70dc-6f76-4319-bdd3-96281e051051",
      "date_of_birth": "1990-01-01",
    },
  ],
 errors: [
    {
       "id": "96281e051051-6f76-4319-bdd3-131e7",
       error: {
         code: 400
         description: Cannot retrieve field for token 96281e051051-6f76-4319-bdd3-131e7
       } 
   }   
  ]
}
```
---
## using skyflow element
    container(type): Container
    Use type: "REVEAL" to create reveal container object

##### reveal(options?) : Promise
- creates container which manages reveal elements

### Steps to use container

###### First step : create reveal container
```const container = skyflow.container("REVEAL");``` 
- Use this container instance to create and manage a group of individual skyflow reveal elements.
- we pass **REVEAL** to create reveal type container object

###### Second step :  create skyflow reveal elements using this container instance

```const element=container.create(revealElementInput, options?)```
```
revealElementInput object
  {
    id: string; //token 
    redaction: string;
    styles?: object;
    label?: string;                
 }
options object
 {
    required?: boolean // default value is false
 }
```
```Note``` : column for nested JSON fields can be given by dot separated strings
  	ex:  column: "address.street.line1"

#### SkyflowStyle
Style object, which consists of CSS properties nested under objects for any of the following variants:
- base, all other variants inherit from these styles
- complete, applied when the Element has valid input
- empty, applied when the Element has no customer input
- focus, applied when the Element has
- invalid, applied when the Element has invalid input

Example style object:
```
styles:{
    base: {
      border: "1px solid #eae8ee",
      padding: "10px 16px",
      "border-radius": "4px",
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
###### Third step :  Create empty div elements
- We need to create empty div elements to specify where our iframe elements will be rendered
- Sample code demonstrates the use of div elements-
In below form we have four div element id's such as #cardNumber, #expireDate , #pin and #CVV and these are the domElement value in #4 step

```
<div class="container">
    <h2>  User Data </h2>
    <form>
      <div id="cardNumber">
        
      </div><br/>
      <div id="expireDate">
        
      </div>  <br/>  
      <div id="cvv">
      
      </div> <br/>  
      <div id="pin">
      
      </div>
      <button type="submit" class="btn btn-primary">Reveal</button>
    </form>
</div>
```

###### Fourth step :  Attach your Element to the DOM : 
```element.mount(domElement): void```
- method attaches your Element to the DOM
- domElement here are id such as pin in #3 step

### Basic usage of all steps
- there must be an empty div in HTML file as mentioned in step 3

```
//create container to manage reveal elements
const container = skyflow.container('REVEAL')   //step 1
//create reveal element using TOKEN
const element = container.create({              //step 2
  id: "131e70dc-6f76-4319-bdd3-96281e051051",
  redaction: "DEFAULT",
  styles: {
      base: {
        color: "#1d1d1d",
      },
    },
  label: "date_of_birth",
})

// renders the skyflow element in the ui
element.mount("#pin")                  //step 4
                                        
// We call reveal() on container object and get data from the vault       
container                                       
 .reveal()                              // step 5
 .then((data) => {
   //handle success
 })
 .catch((err) => {
   //handle error
 });
```


- reveal method will collect all the tokens from element instances, submits the token request and gets the response for valid tokens
Sample Response
```
{
  "success": [
    {
      "id": "131e70dc-6f76-4319-bdd3-96281e051051"
    },
    {
       "id": "131e70dc-6f76-4319-bdd3-96281e051051"
    }
  ],
  "errors": [
    {
       "id": "131e70dc-6f76-4319-bdd3-96281e051051",
       error: {
         code: 400,
         description: Cannot retrieve field for token 131e70dc-6f76-4319-bdd3-96281e051051
       } 
   } 
  ]

  }
```


