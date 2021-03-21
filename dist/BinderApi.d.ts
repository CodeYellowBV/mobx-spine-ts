import { AxiosInstance, AxiosPromise, Method } from 'axios';
export declare class BinderApi {
    axios: AxiosInstance;
    constructor();
    __request(method: Method, url: string, data?: object, options?: object): AxiosPromise;
    get(url: string, data?: object, options?: object): AxiosPromise;
}
