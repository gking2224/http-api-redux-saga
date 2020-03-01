import { IHttpApi, IHttpApiConfig, IRequestOptions, IResponseHandler } from '.';

export class NetworkError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const createResponseHandler = (responsePromise: Promise<Response>): IResponseHandler => {
  return {
    parseResponse: async () => {
      return responsePromise
        .then((res: Response) => {
          if (!res.ok) {
            throw new NetworkError(res.statusText, res.status);
          }
          return res;
        })
        .then(async (res: Response) => {
          const text = await res.text();
          try {
            return {
              status: res.status,
              json: JSON.parse(text),
            };
          }
          catch (err) {
            return {
              status: res.status,
              json: text,
            };
          }
        });
    }
  }
}

const constructEndpoint = (baseApiEndpoint: string, endpoint: string, pathParams: Record<string, string> = {}) => {
  const rawEndpoint = `${baseApiEndpoint}${endpoint}`;
  return Object.keys(pathParams).reduce((acc, key) => {
    return acc.replace(`:${key}`, pathParams[key]);
  }, rawEndpoint);
}

class HttpApi implements IHttpApi {
  config: IHttpApiConfig;

  constructor(config: IHttpApiConfig) {
    this.config = config;
  }

  request = (endpoint: string, options: IRequestOptions): IResponseHandler => {
    const url = constructEndpoint(this.config.apiEndpoint, endpoint, options.pathParams);
    return createResponseHandler(fetch(url, {
      method: options.method,
      body: options.body && JSON.stringify(options.body),
      headers: {
        ...options.body && {'Content-Type': 'application/json'},
        'Accept': 'application/json',
      }
    }));
  }
}

export default HttpApi;
