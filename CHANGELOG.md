# Changelog

All notable changes to this project will be documented in this file.

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
