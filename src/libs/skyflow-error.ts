/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { ErrorType } from '../utils/common';
import { parameterizedString } from '../utils/logs-helper';

export interface ISkyflowError{
  code:string | number,
  description:string,
  type?: ErrorType | string | undefined,
}

export default class SkyflowError extends Error {
  error?: ISkyflowError;

  errors?: ISkyflowError[];

  constructor(errorCode: ISkyflowError,
    args?: any[], isSingularError: boolean = false) {
    const formattedError = {
      code: errorCode.code,
      description: (args && args?.length > 0)
        ? parameterizedString(errorCode.description, ...args)
        : errorCode.description,
      type: errorCode?.type,
    };
    super(formattedError.description);
    if (isSingularError) {
      this.error = formattedError;
    } else {
      this.errors = [formattedError];
    }
  }
}
