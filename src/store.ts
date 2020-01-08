import Vue, { ComputedOptions, WatchOptionsWithHandler, WatchHandler } from 'vue'

import {
  VRSStore,
  VRSStateTree,
  VRSPlugin,
  VRSPluginFunction,
  VRSModules,
  VRSStoreEnhanced,
  VRSStateEnhanced
} from './types'

import { hookWrapper } from './wrapper'

/**
 * Vue Reactive Store,
 * based on VueJS reactivity system.
 * Inspired by VueX and Vue.js instance.
 */
export class VueReactiveStore implements VRSStore {
  /**
   * Global plugins, called each time :
   * * an action is trigerred (before / after hooks)
   * * a property of the state is mutated (after hook)
   * * a computed property has been recomputed (after hook)
   * * a prop property has changed (after hook, mutated out of the store himself)
   * * a watch triger has been trigerred (after hook)
   */
  private static globalPlugins: VRSPlugin[] = []

  static registerPlugin(plugin: VRSPlugin) {
    if (VueReactiveStore.globalPlugins.indexOf(plugin) === -1) {
      VueReactiveStore.globalPlugins.push(plugin)
    } else {
      console.warn("You're trying to add a plugin already registered.")
    }
  }

  /**
   * local Vue instance,
   * to use reactivity system of Vue.js
   */
  private _vm: any

  name = ''
  state: VRSStateTree = {}
  actions: {
    [name: string]: Function
  } = {}
  computed: {
    [name: string]: (() => any) | ComputedOptions<any>
  } = {}
  watch: Record<string, string | WatchOptionsWithHandler<any> | WatchHandler<any>> = {}
  plugins: VRSPlugin[] = []
  modules: VRSModules = {}
  private subStores: {
    [name: string]: VueReactiveStore
  } = {}
  private rootStore: VRSStore

  /**
   * Reactive store based on VueJS reactivity system
   *
   * @param {VRSStore} store
   * The store, composed of :
   * * name
   * * state
   * * computed properties
   * * actions potentially async
   * * watchers
   * * modules, aka sub-stores (wip)
   * * plugins that could be trigerred before / after store evolution
   * @param {VRSStore} rootStore
   * Used only for internal purpose (plugins),
   * reference to the root store.
   */
  constructor(store: VRSStore, rootStore?: VRSStore) {
    if (!store) throw new Error('Please provide a store to VueReactiveStore')
    this.name = store.name || 'my-store'
    this.state = store.state || {}
    this.computed = store.computed || {}
    this.actions = store.actions || {}
    this.watch = store.watch || {}
    this.plugins = []
    if (store.plugins) {
      store.plugins.forEach(p => {
        if (typeof p === 'function') {
          this.plugins.push(p(this))
        } else {
          this.plugins.push(p)
        }
      })
    }
    this.modules = store.modules || {}
    this.rootStore = rootStore || this

    // check if each module doesn't exist in store state
    // or in a computed property
    // to correctly namespace them
    Object.keys(this.modules).forEach(moduleName => {
      if (this.state[moduleName]) {
        const errorMessage = `
          You're trying to add a module which its name already exist as a state property.
          Please rename your module or your state property.
          (Store ${this.name}, property/module ${moduleName})
        `
        throw new Error(errorMessage)
      }
      // if (this.computed[moduleName]) {
      //   const errorMessage = `
      //     You're trying to add a module which its name already exist as a computed property.
      //     Please rename your module or your computed property.
      //     (Store ${this.name}, computed/module ${moduleName})
      //   `
      //   throw new Error(errorMessage)
      // }
      this.subStores[moduleName] = new VueReactiveStore(
        {
          ...this.modules[moduleName],
          name: this.name + '.modules.' + (this.modules[moduleName].name || moduleName),
          plugins: (this.modules[moduleName].plugins || []).concat(this.plugins)
        },
        this.rootStore
      )
    })

    // group all actions hooks available, from global and local plugins
    const actionsHooks = VueReactiveStore.globalPlugins
      .map((hook: VRSPlugin) => ({
        ...hook.actions
      }))
      .concat(
        this.plugins.map((hook: VRSPlugin) => ({
          ...hook.actions
        }))
      )

    Object.keys(this.actions).forEach(key => {
      this.actions[key] = hookWrapper(
        this.rootStore,
        this.name + '.actions.' + key,
        this.actions[key],
        actionsHooks
      )
    })

    // create a Vue instance
    // to use the VueJS reactivity system
    this._vm = new Vue({
      data: () => this.state,
      computed: store.computed,
      watch: store.watch
    })

    // now we can replace the initial store
    // with _vm attributes
    store.state = this._vm.$data

    // listen to state mutations of current store
    // doesn't work for modules because they will be added after
    // knowing each modules has been transformed in VRS
    Object.keys(this.state).forEach(key => {
      this._vm.$watch(
        key,
        (newValue: any, oldValue: any) => {
          // call global hooks in order
          VueReactiveStore.globalPlugins.forEach(hook => {
            hook.state &&
              hook.state.after &&
              hook.state.after(this.rootStore, this.name + '.state.' + key, newValue, oldValue)
          })
          this.plugins.forEach(hook => {
            hook.state &&
              hook.state.after &&
              hook.state.after(this.rootStore, this.name + '.state.' + key, newValue, oldValue)
          })
        },
        {
          deep: true
        }
      )
    })

    // listen to computed properties recomputed
    // idem, doesn't work for modules
    Object.keys(this.computed).forEach(key => {
      this._vm.$watch(
        key,
        (newValue: any, oldValue: any) => {
          // call global hooks in order
          VueReactiveStore.globalPlugins.forEach(hook => {
            hook.computed &&
              hook.computed.after &&
              hook.computed.after(
                this.rootStore,
                this.name + '.computed.' + key,
                newValue,
                oldValue
              )
          })
          this.plugins.forEach(hook => {
            hook.computed &&
              hook.computed.after &&
              hook.computed.after(
                this.rootStore,
                this.name + '.computed.' + key,
                newValue,
                oldValue
              )
          })
        },
        {
          deep: true
        }
      )
    })

    /**
     * We add each module state/computed
     * in the store where they are added
     */
    Object.keys(this.subStores).forEach(moduleName => {
      this.state[moduleName] = this.subStores[moduleName].state
      // this won't work, because in computed we have to store functions,
      // but here we're trying to store Objects... ? so we can't nest modules.computed
      // this.computed[moduleName] = this.subStores[moduleName].computed
    })
  }
}

/**
 * Transform a JavaScript store in a reactive store
 * based on VueJS reactivity system
 *
 * @param store
 * The store, composed of :
 * * name
 * * state
 * * computed properties
 * * actions potentially async (mutactions)
 * * watchers
 * * modules, aka sub-stores
 * * plugins that could be trigerred before / after store evolution
 *
 * @param rootStore
 * Used only for internal purpose (plugins),
 * reference to the root store.
 *
 * @returns
 * Return a reactive store,
 * enhanced with modules state located under the main state
 */
export function createStore<V extends VRSStore>(
  store: V,
  rootStore?: VRSStore
): VRSStoreEnhanced<V> {
  if (!store) throw new Error('Please provide a store')

  let _vm: Vue
  const _localStore: VRSStoreEnhanced<V> = store as VRSStoreEnhanced<V>
  _localStore.state = _localStore.state || ({} as VRSStateEnhanced<V>)
  // _localStore.state = store.state as V['state'] & {
  //   [k in keyof V['modules']]: V['modules'] extends VRSModules ? V['modules'][k]['state'] : 'never'
  // }
  const subStores: { [name: string]: VRSStore } = {}
  const _rootStore: VRSStore = rootStore || store
  const plugins: VRSPlugin[] = []

  /**
   * Modules integration
   * * throw an error if a moduleName is already present in state's properties
   * * build a store for this module
   * * affect the module's state to a new state property which name is the moduleName
   */
  _localStore.modules &&
    Object.keys(_localStore.modules!).forEach(moduleName => {
      if (_localStore.state![moduleName]) {
        const errorMessage = `
        You're trying to add a module which its name already exist as a state property.
        Please rename your module or your state property.
        (Store ${_localStore.name}, property/module ${moduleName})
        `
        throw new Error(errorMessage)
      }
      // we can't do the same for computed,
      // else Vue will detect we have properties (in state / computed) with the same name

      subStores[moduleName] = createStore(
        {
          ...store.modules![moduleName],
          name:
            _localStore.name + '.modules.' + (_localStore.modules![moduleName].name || moduleName),
          plugins: (store.modules![moduleName].plugins || []).concat(_localStore.plugins || [])
        },
        _rootStore
      )

      // @ts-ignore
      _localStore.state![moduleName] = subStores[moduleName].state
    })

  /**
   * The magic is here !
   * We just create a Vue instance
   * to use the VueJS reactivity system.
   * Then we crush the state property of store parameters
   * to redirect to the reactive data object of VueJS instance
   *
   * In Vue 3, it would be more appropriate
   * to use the composition API
   */
  _vm = new Vue({
    data: _localStore.state,
    computed: _localStore.computed,
    watch: _localStore.watch
  })
  store.state = _vm.$data

  /**
   * Plugins integration
   */
  // inventory all plugins, functions or not
  if (_localStore.plugins) {
    _localStore.plugins.forEach(p => {
      if (typeof p === 'function') {
        plugins.push(p(_localStore))
      } else {
        plugins.push(p)
      }
    })
  }

  /**
   * Plugins : Action wrapping
   */
  // then inventory all actions hooks
  const actionsHooks = plugins.map(p => ({ ...p.actions })) || []
  // then wrap all of store actions related with actions' hooks
  _localStore.actions &&
    Object.keys(_localStore.actions).forEach(key => {
      // @ts-ignore
      _localStore.actions[key] = hookWrapper(
        _rootStore,
        _localStore.name + '.actions.' + key,
        _localStore.actions![key],
        actionsHooks
      )
    })

  /**
   * Plugins : State wrapping
   */
  // listen to state mutations of current store
  // doesn't work for modules because they will be added after
  // knowing each modules has been transformed in VRS
  _localStore.state &&
    Object.keys(_localStore.state!).forEach(key => {
      _vm.$watch(
        key,
        (newValue: any, oldValue: any) => {
          plugins.forEach(hook => {
            hook.state &&
              hook.state.after &&
              hook.state.after(_rootStore, _localStore.name + '.state.' + key, newValue, oldValue)
          })
        },
        {
          deep: true
        }
      )
    })

  /**
   * Plugins : Computed properties wrapping
   */
  _localStore.computed &&
    Object.keys(_localStore.computed!).forEach(key => {
      _vm.$watch(
        key,
        (newValue: any, oldValue: any) => {
          plugins.forEach(hook => {
            hook.computed &&
              hook.computed.after &&
              hook.computed.after(
                _rootStore,
                _localStore.name + '.computed.' + key,
                newValue,
                oldValue
              )
          })
        },
        {
          deep: true
        }
      )
    })

  return _localStore
}
