# Changelog

All notable changes to this project will be documented in this file.

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
- Renamed styles to inputSytles in CollectElement
- Renamed styles to inputSytles in RevealElement
- Renamed id to token in request and response of detokenize and `container.reveal()`
