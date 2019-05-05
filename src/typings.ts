// eslint-disable-next-line no-unused-vars
import { ComputedOptions, WatchOptionsWithHandler, WatchHandler } from 'vue'

interface VRSHookFunction {
  (storeName: string, funcName: string, currentState: VRSState): any
}

interface VRSHookFunctionOldNewValues {
  (storeName: string, funcName: string, newValue: any, oldValue: any): any
}

export interface VRSHook {
  after?: VRSHookFunction,
  before?: VRSHookFunction
}

interface VRSHookAfterOnly {
  after: VRSHookFunctionOldNewValues
}

/**
 * Hooks for Vue Reactive Store
 * Functions trigerred :
 * * before / after each actions
 * * after state is mutated
 * * after computed properties are recomputed
 * * before / after watchers are trigerred
 *
 * Each hook function takes 3 to 4 params :
 *   * name of the reactive store
 *   * key, = name of the action, watcher, state or computed property
 *   * currentState (actions / watchers) / initialValue (state / computed)
 *   * finalValue (state / computed)
 */
export interface VRSHooks {
  state?: VRSHookAfterOnly,
  computed?: VRSHookAfterOnly,
  actions?: VRSHook,
  watch?: VRSHook,
}

export interface VRSState {
  [name: string]: any,
}

interface VRSActions {
  [name: string]: Function,
}

export interface VRS {
  name: string,
  state: VRSState,
  actions?: VRSActions,
  computed?: {
    [name: string]: (() => any) | ComputedOptions<any>
  },
  // props?: Object,
  watch?: Record<string, string | WatchOptionsWithHandler<any> | WatchHandler<any>>,
  hooks?: VRSHooks,
  modules?: {
    [name: string]: VRS
  },
}
