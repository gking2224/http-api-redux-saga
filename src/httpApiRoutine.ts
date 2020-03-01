import { createRoutine, promisifyRoutine, bindPromiseCreators } from 'redux-saga-routines';
import { ErrorPayload, IdentityFunction, NoOpPayloadCreator, ErrorPayloadCreator, NilMetaCreator, HttpApiRoutine, CallbackFn } from '.';
import { Dispatch } from 'redux';

const noOp = (..._args: any[]) => undefined;
const identityOp = <T> (payload: T) => payload;
const errorCreator = (err: ErrorPayload) => err;

export const createHttpApiRoutine = <T, R>(type: string): HttpApiRoutine<T, R> => {
    const r = createRoutine<
        IdentityFunction<T>,
        NoOpPayloadCreator,
        IdentityFunction<R>,
        ErrorPayloadCreator,
        NoOpPayloadCreator,
        NilMetaCreator,
        NilMetaCreator,
        NilMetaCreator,
        NilMetaCreator,
        NilMetaCreator
    >(
        type,
        {
            trigger: identityOp,
            request: noOp,
            success: identityOp,
            failure: identityOp,
            fulfill: errorCreator
        },
        {
            trigger: noOp,
            request: noOp,
            success: noOp,
            failure: noOp,
            fulfill: noOp
        }
    );
    return r as HttpApiRoutine<T, R>;
};

export const runHttpApiRoutine = async <T, R, C = void> (routine: HttpApiRoutine<T, R>, values: T, dispatch: Dispatch, onSuccess?: CallbackFn<R, C> ): Promise<R|C> => {
  const promiseCreator = promisifyRoutine(routine);
  const promise = bindPromiseCreators({
      promiseCreator
    }, dispatch).promiseCreator;

  const response = await new Promise<R>((res, rej) => {
    promise(values).then(res, rej);
  });
  if (onSuccess) {
    return onSuccess(response);
  }
  return response;
}
