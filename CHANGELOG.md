# Changelog

All notable changes to this project will be documented in this file.
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
