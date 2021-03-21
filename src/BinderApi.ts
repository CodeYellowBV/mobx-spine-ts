import axios, {AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse, Method} from 'axios';

interface RequestOptions {
    // If true, returns the whole axios response. Otherwise, parse the response data,
    skipFormatter?: boolean
}


export class BinderApi {

    axios: AxiosInstance = axios.create();

    constructor() {
    }

    __request(method: Method, url: string, data?: object, options?: RequestOptions): Promise<object> {
        if (!options) {
            options = {};
        }

        const config: AxiosRequestConfig = {
            url: url,
            method: method

        };
        const xhr: AxiosPromise = this.axios(config);

        const onSuccess =
            options.skipFormatter === true
                ? foo => foo
                : this.__responseFormatter;


        return xhr.then(onSuccess);
    }

    __responseFormatter(res: AxiosResponse): object {
        return res.data
    }

    get(url: string, data?: object, options ?: RequestOptions):  Promise<object> {
        return this.__request('get', url, data, options);
    }
}

