import Axios, { AxiosInstance } from 'axios';

export class Api {
    private static _instance: Api;
    private _privateGateway: AxiosInstance;
    private _publicGateway: AxiosInstance;
    private _otherGateway: AxiosInstance;

    constructor() {
        this._privateGateway = Axios.create({
            baseURL: process.env.REACT_APP_API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        this._publicGateway = Axios.create({
            baseURL: process.env.REACT_APP_API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        this._otherGateway = Axios.create({
            baseURL: process.env.REACT_APP_API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
    }

    init() {
        //
    }

    async setup() {
        this._privateGateway.interceptors.response.use(
            (response) => response.data,
            (error) => Promise.reject(error.response.data)
        );
        this._publicGateway.interceptors.response.use(
            (response) => response.data,
            (error) => Promise.reject(error.response.data)
        );
        this._otherGateway.interceptors.response.use(
            (response) => response.data,
            (error) => Promise.reject(error.response.data)
        );
    }

    static get instance() {
        if (!Api._instance) {
            Api._instance = new Api();
            Api._instance.setup();
        }

        return Api._instance;
    }

    getPrivateGateway() {
        return this._privateGateway;
    }

    getPublicGateway() {
        return this._publicGateway;
    }

    getOtherGateway() {
        return this._otherGateway;
    }
}
