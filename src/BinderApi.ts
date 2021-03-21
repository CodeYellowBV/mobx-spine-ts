import axios, {AxiosInstance, AxiosPromise, AxiosRequestConfig, Method} from 'axios';

export class BinderApi {

    axios: AxiosInstance = axios.create()

    __request(method: Method, url: string, data?: object, options?: object): AxiosPromise {

        const config: AxiosRequestConfig = {
            url: url,
            method: method

        };
        const xhr: AxiosPromise = this.axios(config);


        return xhr;

    }

    get(url: string, data?: object, options ?: object): AxiosPromise {
        return this.__request('get', url, data, options);
    }
}

