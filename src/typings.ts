// eslint-disable-next-line no-unused-vars
import { ComputedOptions, WatchOptionsWithHandler, WatchHandler } from 'vue'

interface VRSHookFunction {
  (store: VRSStore, funcName: string, wrapperId: string): any
}

interface VRSHookFunctionOldNewValues {
  (store: VRSStore, funcName: string, newValue: any, oldValue: any): any
}

export interface VRSHook {
  after?: VRSHookFunction,
  before?: VRSHookFunction
}

interface VRSHookAfterOnly {
  after: VRSHookFunctionOldNewValues
}

/**
 * Plugin for Vue Reactive Store,
 * composed of hooks trigerred :
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
export interface VRSPlugin {
  actions?: VRSHook,
  state?: VRSHookAfterOnly,
  computed?: VRSHookAfterOnly,
  watch?: VRSHook,
}

export interface VRSPluginFunction {
  (store: VRSStore): VRSPlugin
}

export interface VRSState {
  [name: string]: any,
}

export interface VRSComputed {
  [name: string]: (() => any) | ComputedOptions<any>
}

interface VRSActions {
  [name: string]: Function,
}

/**
 * Store of VRS
 */
export interface VRSStore {
  name?: string,
  state?: VRSState,
  actions?: VRSActions,
  computed?: VRSComputed,
  // props?: Object,
  watch?: Record<string, string | WatchOptionsWithHandler<any> | WatchHandler<any>>,
  plugins?: Array<VRSPlugin | VRSPluginFunction>,
  modules?: {
    [name: string]: VRSStore
  },
}
