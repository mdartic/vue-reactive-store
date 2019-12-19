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
  // getters: VRSComputed | undefined;
  _mutations: { [index: string]: Function }
  _devtoolHook: Function
  flushStoreModules: Function
  registerModule: Function
  unregisterModule: Function
  replaceState: Function
}

/**
 * This object allows us to store a state
 * * recordEvents allow devtools plugin communicate to vue-devtools
 */
const VRSDevtoolsState = {
  recordEvents: true
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
  if (!devtoolHook) {
    console.warn('[vrs-plugin-devtools] vue-devtools is not installed. Please install before trying to use vrs-plugin-devtools')
    return {}
  }

  vrsStore._mutations = {}
  vrsStore._devtoolHook = devtoolHook

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
    if (!targetState) {
      console.warn('[vrs-plugin-devtools] state is null. can\'t replace a state with null')
      return
    }
    Object.keys(targetState).forEach(k => {
      if (targetStore.modules && targetStore.modules[k]) return replaceState(targetStore.modules[k], targetState[k])
      targetStore.state![k] = targetState[k]
    })
  }

  vrsStore.replaceState = (targetState: VRSState) => {
    console.info('[vrs-plugin-devtools] replacing state... (asked by vue-devtools) ', JSON.parse(JSON.stringify(targetState)), vrsStore.name)
    console.info('[vrs-plugin-devtools] stop recording mutations', vrsStore.name)
    VRSDevtoolsState.recordEvents = false
    replaceState(vrsStore, targetState)
    VRSDevtoolsState.recordEvents = true
    console.info('[vrs-plugin-devtools] start recording mutations', vrsStore.name)
  }

  /**
   * We react to the `vuex:travel-to-state` event of vue-devtools
   */
  devtoolHook.on('vuex:travel-to-state', (targetState: VRSState) => {
    console.info('[vrs-plugin-devtools] travel to state... (asked by vue-devtools) ', targetState)
    vrsStore.replaceState(targetState)
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
        if (!VRSDevtoolsState.recordEvents) return
        const jsonStoreState = JSON.parse(JSON.stringify(rootStore.state))

        /**
         * In VueX, there is an array of mutations in `_mutations` property
         * Not in vue-reactive-store
         * This code is here to mimic the array,
         * so vue-devtools could trigger every mutation
         * on the initial store it knows, thanks to the `vue:init` event
         */
        vrsStore._mutations[stateProperty] = (payload: any) => {
          const arrayPaths = stateProperty.split('.')
          // storeName.state.property => 3 elements, it's a property
          if (arrayPaths.length < 3) return
          if (arrayPaths[0] !== vrsStore.name) return
          if (arrayPaths[1] !== 'state') return
          let currentStateObject = vrsStore.state || {}
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
