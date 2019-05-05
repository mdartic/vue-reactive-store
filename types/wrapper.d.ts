import { VRSHooks } from './typings';
/**
 * Wrapper for action,
 * allow for triger hooks
 */
export declare const actionWrapper: (storeName: string, storeState: Object, funcName: string, func: Function, storeHooks: VRSHooks, globalHooks: VRSHooks[]) => (...args: any) => Promise<void>;
