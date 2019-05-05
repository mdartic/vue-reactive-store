import { ComputedOptions, WatchOptionsWithHandler, WatchHandler } from 'vue';
export interface VRSHooks {
    state?: {
        after?: Function;
    };
    computed?: {
        after?: Function;
    };
    actions?: {
        before?: Function;
        after?: Function;
    };
    watch?: {
        before?: Function;
        after?: Function;
    };
}
export interface VRS {
    name: string;
    state: {
        [name: string]: any;
    };
    actions?: {
        [name: string]: Function;
    };
    computed?: {
        [name: string]: (() => any) | ComputedOptions<any>;
    };
    watch?: Record<string, string | WatchOptionsWithHandler<any> | WatchHandler<any>>;
    hooks?: VRSHooks;
    modules?: {
        [name: string]: VRS;
    };
}
