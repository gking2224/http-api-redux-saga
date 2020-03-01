import { takeEvery, call, all, put } from 'redux-saga/effects';
import { IHttpApi, IResponsePayload, HttpApiRoutine, IHttpApiDefinitions, IHttpApiDefinition, IHttpApiConfig } from '.';
import HttpApi from './httpApi';

export const createHttpApiSaga = (config: IHttpApiConfig, apiDefinitions: IHttpApiDefinitions) => {

  const api: IHttpApi = new HttpApi(config);
  const doFetch = async <Response> (apiDefinition: IHttpApiDefinition<any, any, any, HttpApiRoutine<any, any>>, payload: any, pathParams?: Record<string, string>): Promise<Response> => {

    const response = await api.request(apiDefinition.endpoint, {
      method: apiDefinition.method,
      pathParams,
      body: apiDefinition.method === 'GET'? undefined : payload,
    })
    .parseResponse() as IResponsePayload<Response>;

    return response.json;
  }

  const createSagaFromApiDefinition = <Trigger, Response, Payload> (apiDefinition: IHttpApiDefinition<Trigger, Response, Payload, HttpApiRoutine<Trigger, Payload>>) => {
    return function*() {
      yield takeEvery(apiDefinition.routine.TRIGGER, function*(action: any) {
        const { payload } = action;
        let pathParams: Record<string, string> | undefined = undefined;
        if (apiDefinition.getPathParams) {
          pathParams = yield call(apiDefinition.getPathParams, payload);
        }
        yield put(apiDefinition.routine.request());
        try {
          const result: Response = yield call(doFetch, apiDefinition, payload, pathParams);

          let successPayload: Payload;
          if (apiDefinition.transformResponse) {
            const transform = apiDefinition.transformResponse;
            successPayload = yield call(transform, result);
          } else {
            successPayload = (result as any) as Payload;
          }
          yield put(apiDefinition.routine.success(successPayload));
        } catch (err) {
          console.log(err);
          yield put(apiDefinition.routine.failure({
            errorMessage: err.message,
            statusCode: err.status
          }));
        } finally {
          yield put(apiDefinition.routine.fulfill())
        }
      });
    };
  };

  return function* apiSaga() {
    yield all(
      apiDefinitions.map(a => createSagaFromApiDefinition(a)())
    )
  }
}
