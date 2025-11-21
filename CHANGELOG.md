# Changelog

All notable changes to this project will be documented in this file.

## [2.6.0] - 2025-11-19
### Added
- Composable Reveal elements
- Render and reveal using composable reveal
- Upload Single and multi files support in composable collect
- Render Composable reveal and collect elements inside shadow dom

## [2.5.0] - 2025-10-30
### Added
- Update pure js method

## [2.4.4] - 2025-10-20
### Fixed
- Fix Typescript gaps

## [2.4.3] - 2025-08-01
### Fixed
- Fix BIN Lookup for Card Numbers with Formats Other Than Spaces

## [2.4.2] - 2025-07-24
### Fixed
- Element state in event listeners for collect elements in `PROD` env.

## [2.4.1] - 2025-06-19
### Fixed
- Make `scheme` optional in `CardMetadata`.

## [2.4.0] - 2025-06-19
### Added
- Typescript support for public interfaces.

## [2.3.3] - 2025-06-16
### Fixed
- Expiration date validations.

## [2.3.2] - 2025-06-12
### Fixed
- Refactor stale elements code.

## [2.3.1] - 2025-06-03
### Fixed
- Add check for empty container for collect and reveal.
### Changed
- Update 3DS browser details helper function.

## [2.3.0] - 2025-05-26
### Added
- Iframe refactoring. 

## [2.2.3] - 2025-05-08
### Added
- Add overloading method signatures for container initialisation.

## [2.2.2] - 2025-04-22
### Added
- Add boolean value in options to add validation check for blocking empty files.

## [2.2.1] - 2025-04-08
### Added
- Validation check for blocking 0 byte size files.

## [2.2.0] - 2025-04-08
### Added
- Masking support for collect elements.

## [2.1.3-beta.1] - 2025-04-08
### Added
- Iframe refactoring

## [2.1.3] - 2025-04-07
### Added
- Flexibility to display the desired card brand scheme for card brand choice.

## [2.1.2] - 2025-03-03
### Fixed
- Resize observer logic for skyflow elements.

## [2.1.1] - 2025-03-03
### Fixed
- Resize observer logic for skyflow elements.

## [2.1.0] - 2025-02-10
### Added
- Support for 3DS helper functions.

## [2.0.0] - 2025-01-20
### Added
- Support for iframe versioning.

## [1.38.2] - 2024-11-12
### Fixed
- Bug for validations.

## [1.38.1] - 2024-11-12
### Fixed
- Element validations for element value match rule.

## [1.38.0] - 2024-09-11
### Chnages
- Error messages for various scenarios.

## [1.37.1] - 2024-09-03
### Added
- React support for coralogix iframe metrics.

## [1.37.0] - 2024-09-03
### Added
- Support for coralogix iframe metrics.

## [1.36.5] - 2024-08-27
### Fixed
- Fixed safari bug.

## [1.36.4] - 2024-08-20
### Fixed
- Custom validation rule `ELEMENT_VALUE_MATCH_RULE` not working for Composable Elements.

## [1.36.3] - 2024-08-12
### Fixed
- `update` method not working while updating custom validation rules.

## [1.36.2] - 2024-07-31
### Added
- Custom error message support for prebuilt collect elements.

### Fixed
- Input error for card number when pasting a valid VISA card number by clearing the existing AMEX card number
- Remove format from copy text in card number element in JS SDK
- Hide copy icon when data is invalid in collect elements in JS SDK
- Change MasterCard to Mastercard in card brand choice dropdown

## [1.36.1] - 2024-07-02
### Fixed
- Restrict file types to upload

## [1.36.0] - 2024-05-08
### Added
- card brand choice support for card number element.

## [1.35.1] - 2024-04-12
### Added
- iframe latency metrics.

## [1.35.0] - 2024-04-02
### Added
- `preserveFileName` option in file element options.

## [1.34.3] - 2024-03-05
### Added
- File render element enhancement.


## [1.34.2] - 2024-01-25
### Fixed
- Fixed multiple column names error with unique column values in `get` interface.


## [1.34.1] - 2024-01-10
### Added
- File name validations in file upload

### Fixed
- Invalid styles applied on expiry date and expiry month on initial render
- Custom validation error text overridden by required error text on empty values.

## [1.34.0] - 2023-12-15
### Added
- Ability to update Collect and Reveal element properties dynamically.

### Fixed
- iFrame height resize issue
- ExpiryMonth Element's invalid input styles issue

## [1.33.4] - 2023-12-07
### Fixed
- jQuery dependency replacement changes.

## [1.33.3] - 2023-11-15
### Fixed
-  Patch fix for reverting changes for internal jQuery dependency changes.

## [1.33.2] - 2023-11-13
### Changed
- Replace internal jQuery dependency with custom implementation.

## [1.33.1] - 2023-11-10
### Added
-  file render internal code change

## [1.33.0] - 2023-11-07
### Added
- Added file render elements

## [1.32.0] - 2023-10-26
### Added
- `tokens` support in Get interface

## [1.31.1] - 2023-10-17
### Fixed
- Expiration-year max-length based on format.
- Card icon render with  setValue method.

## [1.31.0] - 2023-10-06
### Added
- `allowedFileType` option for file input element.
- `valueType` in detokenize and reveal response.

### Fixed
- iFrame height resize.
## [1.30.3] - 2023-09-29
### Fixed
- removed assets from build and updated build config for core-js.
## [1.30.2] - 2023-09-26
### Fixed
- updated internal imports and removed unused dependencies.
## [1.30.1] - 2023-08-14
### Added
- Add requiredAsterisk style and global styles.

## [1.30.0] - 2023-08-01
### Added
- Add numeric keyboard support.

## [1.29.5] - 2023-07-26
### Fixed
- fix conditions for element mount. 

## [1.29.4] - 2023-07-20
### Fixed 
- fix reveal elements iframe race condition.    

## [1.29.3] - 2023-07-07
### Fixed 
- patch fix for previous version. 

## [1.29.2] - 2023-07-07
### Fixed
- fix iframe race condition between collect element and container.

## [1.29.1] - 2023-06-22
### Fixed
- Patch fix for autofill and iframe loading issue

## [1.29.0] - 2023-06-22
### Added
- Added new `delete` interface
- Added input formatting for collect and reveal elements
    
## [1.28.0] - 2023-03-29
### Added
-  Update data through collect element using skyflow id

## [1.27.4] - 2023-03-16
### Added
-  Added update element interface for composable  elements.

## [1.27.3] - 2023-03-10
### Fixed
-  Fixed Validation for File Input

## [1.27.2] - 2023-03-09
### Removed
-  Removed grace period logic in bearer token generation

## [1.27.1] - 2023-03-01
### Fixed
-  Fix grace period in caching of bearer token

## [1.27.0] - 2023-02-20
### Added
-  Input formatting to reveal elements

## [1.26.1] - 2023-02-20
### Fixed
-  Bug fixes related to change event listeners,custom validations. 

## [1.26.0] - 2023-02-15
### Fixed
-  Composable elements improvements and minor bug fixes.

## [1.25.0] - 2023-02-01
-   Added `redaction` type support in `detokenize` interface.

## [1.24.0] - 2023-01-17
### Added
-  Added new `Composable` Elements.
## [1.23.0] - 2022-12-27
### Added
-  Added new `get` interface.

## [1.22.0] - 2022-11-15
### Added
- `upsert` support while collecting data through skyflow elements.
- `upsert` support for pure js `insert` method.
## [1.21.3] - 2022-10-18
### Added
- `cardIcon` and `copyIcon` style objects for collect and reveal elements.

## [1.21.2] - 2022-10-04
### Fixed
- Fix regression in `card_number` element
- Cleanup reveal options

## [1.21.1] - 2022-09-20
### Changed
- Removed `invokeConnection()`
- Removed `invokeSoapConnection()`
## [1.20.0] - 2022-09-13

### Changed
- Update custom validation samples in JS SDK 
- Update Log Level log 
  
## [1.19.0] - 2022-08-30

### Added
-  `FILE_INPUT` element type

## [1.18.0] - 2022-07-05

### Added
- Copy icon in collect and reveal elements

## [1.17.1] - 2022-06-28

### Added
- Copyright header to all files
- Security email in README
## [1.17.0] - 2022-06-21

### Changed
- Updated AMEX card icon
## [1.16.1] - 2022-06-14

### Changed
- Return 6 digit BIN value for AMEX Card Number Collect Element
## [1.16.0] - 2022-06-07

### Changed
- Return 8 digit BIN value for Card Number Collect Elements 

## [1.15.0] - 2022-05-24


### Added
-   Support for generic card types

### Changed
- Deprecated `invokeConnection()`
- Deprecated `invokeSoapConnection()`


## [1.14.0] - 2022-04-19

### Added
- `EXPIRATION_YEAR` element type
- `EXPIRATION_MONTH` element type

## [1.13.0] - 2022-04-05

### Added
- support for application/x-www-form-urlencoded and multipart/form-data content-type's in connections

## [1.12.2] - 2022-03-29

### Changed
- Added validation of JWT token format from TokenProvider

### Fixed 
-  Request headers not getting overriden due to case sensitivity

## [1.12.1] - 2022-03-22

Fixed
- Fixes in multiple skyflow clients creation

## [1.12.0] - 2022-02-24

Added
- `requestId` in error logs and error responses
- add autocomplete for collect elements

## [1.11.0] - 2022-02-08

### Added
- `replaceText` option for `RevealElement`

## [1.10.0] - 2022-01-25

### Added
- `formatRegex` option for `RevealElement`

## [1.9.1] - 2022-01-11

### Fixed
- Fixes in `invokeSoapConnection` method

## [1.9.0] - 2022-01-11

### Added
- `Soap protocol` support for connections

## [1.8.0] - 2021-12-07

### Added
- `setError(error: string)` method to set custom UI error to be displayed on the collect and reveal Elements
- `resetError()` method is used to clear the custom UI error message set through setError 
- `format` parameter in `collectElementOptions` to support different type of date formats for `EXPIRATION_DATE` element
- `setValue(value: string)` and `clearValue()` method in DEV env, to set/clear the value of a collect element.
- `setToken(value: string)` method to set the token for a reveal element.
- `setAltText(value: string)` and `clearAltText()` method to set/clear the altText for a reveal 
### Changed

- Changed error messages in the logs and callback errors.
- `altText` support has been deprecated for collect element
- `vaultID` and `vaultURL` are now optional parameters in Configuration constructor

### Fixed
- Updating UI error messages

## [1.7.0] - 2021-11-24
### Added
- `validations` option in `CollectElementInput` that takes an array of validation rules
- `REGEX_MATCH_RULE`, `LENGTH_MATCH_RULE` & `ELEMENT_MATCH_RULE` Validation rules types
- `PIN` Element type

### Fixed
- Card Number validation


## [1.6.0] - 2021-11-16

### Added
- `enableCardIcon` option to configure Card Icon visibility
- `INPUT_FIELD` Element type for custom UI elements
- `unmount` method to reset collect element to initial state

### Changed
- New VISA Card Icon with updated Logo

## [1.5.0] - 2021-11-10

### Changed
- Renamed invokeGateway to invokeConnection
- Renamed gatewayURL to connectionURL
## [1.4.0] - 2021-10-26

### Added

Detecting card type and displaying icon in the card number element

## [1.3.0] - 2021-10-19

### Added

- `logLevel` option to allow different levels of logging
- event listeners for collect element
- `env` option for accessibilty of value in event listeners

### Changed
- Standardized error information for easier debugging
- deprecated redaction in `detokenize` method
- change in `detokenize` response format

### Fixed
- Some error scenarios acting unexpectedly

## [1.2.0] - 2021-10-05

### Added

- invokeGateway method to work with inbound/outbound integrations using Skyflow Gateway

### Changed
- `table` and `column` are optional in CollectElementInput, when using invokeGateway
- `token` and `redaction` are optional in RevealElementInput, when using invokeGateway


## [1.1.0] - 2021-09-22

### Fixed:

- fix console errors

### Added

- getById method to reveal fields using SkyflowID's
- support for Non-PCI fields, data can be passed as additional fields in container.collect method
- altText for CollectElement 
- labelStyles for CollectElement
- errorTextStyles for CollectElement
- altText for RevealElement 
- labelStyles for RevealElement
- errorTextStyles for RevealElement
- default error message for RevealElement

### Changed

- Renamed get method to `detokenize`
- Renamed styles to inputStyles in CollectElement
- Renamed styles to inputStyles in RevealElement
- Renamed id to token in request and response of detokenize and `container.reveal()`
