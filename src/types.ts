// eslint-disable-next-line no-unused-vars
import { ComputedOptions, WatchOptionsWithHandler, WatchHandler } from 'vue'

interface VRSHookFunction {
  (store: VRSStore, funcName: string, wrapperId: string): any
}

interface VRSHookFunctionOldNewValues {
  (store: VRSStore, funcName: string, newValue: any, oldValue: any): any
}

export interface VRSHook {
  after?: VRSHookFunction
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
  actions?: VRSHook
  state?: VRSHookAfterOnly
  computed?: VRSHookAfterOnly
  watch?: VRSHook
}

export interface VRSPluginFunction {
  (store: VRSStore): VRSPlugin
}

/**
 * typings cloned from posva/pinia repository
 * thanks a lot to him !
 */
interface JSONSerializable {
  toJSON(): string
}

export type VRSStateTreeValue =
  | string
  | symbol
  | number
  | boolean
  | null
  | void
  | Function
  | VRSStateTree
  | VRSStateTreeArray
  | JSONSerializable

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VRSStateTree extends Record<string | number | symbol, VRSStateTreeValue> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface VRSStateTreeArray extends Array<VRSStateTreeValue> {}

export interface VRSComputed {
  [name: string]: (() => any) | ComputedOptions<any>
}

export interface VRSModules extends Record<string | number | symbol, VRSStore> {}

export interface VRSActions {
  [name: string]: Function
}

/**
 * Store of VRS
 */
export type VRSStore = {
  name: string
  state?: VRSStateTree
  actions?: VRSActions
  computed?: VRSComputed
  watch?: Record<string, string | WatchOptionsWithHandler<any> | WatchHandler<any>>
  plugins?: Array<VRSPlugin | VRSPluginFunction>
  modules?: VRSModules
}

export type VRSStateEnhanced<V extends VRSStore> = V['state'] &
  {
    [k in keyof V['modules']]: V['modules'] extends VRSModules
      ? V['modules'][k]['state'] extends VRSStateTree
        ? V['modules'][k]['state']
        : 'never'
      : 'never'
  }

export type VRSStoreEnhanced<V extends VRSStore> = {
  name: V['name']
  state?: VRSStateEnhanced<V>
  actions?: V['actions'] extends VRSActions ? V['actions'] : never
  computed?: V['computed'] extends VRSComputed ? V['computed'] : never
  watch?: V['watch'] extends Record<
    string,
    string | WatchOptionsWithHandler<any> | WatchHandler<any>
  >
    ? V['watch']
    : never
  plugins?: V['plugins'] extends Array<VRSPlugin | VRSPluginFunction> ? V['plugins'] : never
  modules?: V['modules'] extends VRSModules ? V['modules'] : never
}
