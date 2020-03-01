import HttpApi from './httpApi';
import { createHttpApiRoutine, runHttpApiRoutine } from './httpApiRoutine';
import { createHttpApiSaga } from './httpApiSaga';
import { ResolveActionCreatorByPayload, Routine } from 'redux-saga-routines';

export interface IHttpApiConfig {
  apiEndpoint: string;
}

export interface IHttpApi {
  request: (endpoint: string, options: IRequestOptions) => IResponseHandler;
}

export interface IRequestOptions {
  method: string;
  pathParams?: Record<string, string>;
  body?: any;
}

export interface IResponsePayload<R> {
  status: number;
  json: R;
}

export interface IResponseHandler {
  parseResponse: <R> () => Promise<IResponsePayload <R>>;
}


// redux-saga-routines
export interface ErrorPayload {
  errorMessage: string;
  statusCode: number;
}
export type NilMetaCreator = (...args: any[]) => void;
export type NoOpPayloadCreator = (...args: any[]) => void;
export type IdentityFunction<T> = (obj: T) => T;
export type ErrorPayloadCreator = IdentityFunction<ErrorPayload>;

export type HttpApiRoutine<T, R> = Routine<
  ResolveActionCreatorByPayload<IdentityFunction<T>>,
  ResolveActionCreatorByPayload<NoOpPayloadCreator>,
  ResolveActionCreatorByPayload<IdentityFunction<R>>,
  ResolveActionCreatorByPayload<ErrorPayloadCreator>,
  ResolveActionCreatorByPayload<NoOpPayloadCreator>>;

export type CallbackFn<R, C> = (successPayload: R) => C;

export interface IHttpApiDefinition<Trigger, Response, Payload, Routine extends HttpApiRoutine<Trigger, Payload>> {
  name: string;
  routine: Routine;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  transformResponse?: (r: Response) => Payload;
  getPathParams?: (t: Trigger) => Record<string, string>;
}

export type IHttpApiDefinitions = ReadonlyArray<IHttpApiDefinition<any, any, any, HttpApiRoutine<any, any>>>;

export {
  createHttpApiRoutine,
  runHttpApiRoutine,
  HttpApi,
  createHttpApiSaga,
}
