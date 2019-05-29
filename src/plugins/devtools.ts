// eslint-disable-next-line
import { VRSState, VRSStore, VRSPlugin } from '../typings'

// eslint-disable-next-line no-nested-ternary
const target = typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
    ? global
    : {}
// @ts-ignore
const devtoolHook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__

/**
 * This interface is here to 'copy' the vuex / vue-devtools communication
 * It help VRS to be 'time travel' compatible,
 * and tell vue-devtools all mutations in vuex tab
 */
interface VRSStoreForDevtools extends VRSStore {
  _mutations: { [index: string]: Function }
  _devtoolHook: Function
  flushStoreModules: Function
  registerModule: Function
  unregisterModule: Function
  replaceState: Function
}

/**
 * VRS Plugin for vue-devtools / vuex tab
 * Try to imitate the communication between vuex and vue-devtools
 *
 * In VueX, each mutation is forwarded to vue-devtools,
 * and time-travel is get by 'replaying' each mutation on the store's base state
 *
 * So we do the same for VRS
 *
 * @param vrsStore
 */
const vrsPluginDevtools = (vrsStore: VRSStoreForDevtools): VRSPlugin => {
  vrsStore._mutations = {}
  vrsStore._devtoolHook = devtoolHook

  let disableVueDevtoolsEvents = false

  /**
   * These three methods are required,
   * but for my current knowledge,
   * it seems useless for VRS
   */
  vrsStore.flushStoreModules = () => {
    console.warn('[vrs-plugin-devtools]flush vrsStore modules is not implemented (asked by vue-devtools)')
  }
  vrsStore.registerModule = (module: string) => {
    console.warn(`[vrs-plugin-devtools]registerModule is not implemented (asked by vue-devtools for module '${module}')`)
  }
  vrsStore.unregisterModule = (module: string) => {
    console.warn(`[vrs-plugin-devtools]unregisterModule is not implemented (asked by vue-devtools for module '${module}')`)
  }

  /**
   * The replaceState method is called
   * after vue-devtools get the 'final' state
   * after replaying all mutations to the 'active state'
   */
  function replaceState (targetStore: VRSStore, targetState: VRSState) {
    Object.keys(targetState).forEach(k => {
      if (targetStore.modules && targetStore.modules[k]) return replaceState(targetStore.modules[k], targetState[k])
      targetStore.state![k] = targetState[k]
    })
  }

  vrsStore.replaceState = (targetState: VRSState) => {
    console.info('[vrs-plugin-devtools] replacing state... (asked by vue-devtools) ', targetState)
    replaceState(vrsStore, targetState)
  }

  /**
   * We react to the `vuex:travel-to-state` event of vue-devtools
   */
  devtoolHook.on('vuex:travel-to-state', (targetState: VRSState) => {
    disableVueDevtoolsEvents = true
    vrsStore.replaceState(targetState)
    disableVueDevtoolsEvents = false
  })

  // we emit the first event to vue-devtools, base state of the store
  devtoolHook.emit('vuex:init', vrsStore)

  /**
   * The plugin is only for state mutations
   * We could imagine in the near future
   * emit some events for actions trigerred and computed properties recomputed
   */
  return {
    state: {
      after (rootStore, stateProperty, newValue) {
        // we emit events only if it's not disabled
        if (disableVueDevtoolsEvents) return
        const jsonStoreState = JSON.parse(JSON.stringify(rootStore.state))

        vrsStore._mutations[stateProperty] = (payload: any) => {
          const arrayPaths = stateProperty.split('.')
          if (arrayPaths.length < 3) return
          if (arrayPaths[0] !== vrsStore.name) return
          if (arrayPaths[1] !== 'state') return
          let currentStateObject = vrsStore.state
          let targetStateObject = null
          let i = 2
          for (i; i < arrayPaths.length; i++) {
            currentStateObject = currentStateObject![arrayPaths[i]]
            if (!currentStateObject) break
            if (i === arrayPaths.length - 1) {
              targetStateObject = currentStateObject
            }
          }
          if (targetStateObject === currentStateObject) {
            targetStateObject = payload
          }
        }
        devtoolHook.emit('vuex:mutation', {
          type: stateProperty,
          payload: newValue
        }, jsonStoreState)
      }
    }
  }
}

export default vrsPluginDevtools
