import { ErrorType } from './errorType';

export interface ErrorResponse {
  errorType: ErrorType;
  message: string;
  bannedUntil?: string;
}
