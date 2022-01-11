# Changelog

All notable changes to this project will be documented in this file.


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
