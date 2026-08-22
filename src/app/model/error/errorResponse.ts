import { ErrorBody } from './errorBody';
import { ErrorType } from './errorType';

export interface ErrorResponse {
  errorType: ErrorType;
  body: ErrorBody;
  bannedUntil?: string;
  message?: string;
}
