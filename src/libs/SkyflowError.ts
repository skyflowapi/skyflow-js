import { parameterizedString } from '../utils/logsHelper';

export interface ISkyflowError{
  code:string | number,
  description:string,
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
    };
    super(formattedError.description);
    if (isSingularError) {
      this.error = formattedError;
    } else {
      this.errors = [formattedError];
    }
  }
}
