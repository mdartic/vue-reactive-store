// import 'jest';
import Vue from 'vue'
import { VueReactiveStore } from './store'

// eslint-disable-next-line no-unused-vars
import { VRSStore, VRSHook, VRSPlugin, VRSState } from './typings'

describe('VueReactiveStore', () => {
  test('has global hooks available', () => {
    expect(VueReactiveStore.registerPlugin).toBeDefined()
  })
  test('is built with a JS Object with a state sharing the same reference than VRS Store', () => {
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const store = new VueReactiveStore({
      name: 'my-store',
      state
    })
    expect(store.name).toBe('my-store')
    expect(store.state).toBe(state)
    expect(store.computed).toStrictEqual({})
    expect(store.actions).toStrictEqual({})
    expect(store.plugins).toStrictEqual([])
    expect(store.modules).toStrictEqual({})
  })
  test('can be mutated directly and the state of VRS Store is equal', () => {
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const store = new VueReactiveStore({
      name: 'my-store',
      state
    })
    state.myData = 'hello'
    expect(state.myData).toBe('hello')
    expect(store.state.myData).toBe('hello')
    expect(state.myData).toBe(store.state.myData)
  })
  test('add reactive modules to the main store', () => {
    const module1 = {
      name: 'module1',
      state: {
        myData: 'myData of module1',
        myData2: 'myData2 of module1'
      },
      computed: {
        myComputed () {
          return module1.state.myData + module1.state.myData2
        }
      }
    }
    const jsStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      modules: {
        module1
      }
    }
    const store = new VueReactiveStore(jsStore)
    expect(store.state.module1).toBe(module1.state)
  })
  test('throw an error when a module is named like a state prop', () => {
    const module1: VRSStore = {
      name: 'module1',
      state: {
        myData: 'myData of module1',
        myData2: 'myData2 of module1'
      }
    }
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      modules: {
        myData: module1
      }
    }
    expect(() => {
      const reactiveStore = new VueReactiveStore(jsStore)
    }).toThrow()
  })

  /**
   * Hooks testing
   */
  test('call hookWrapper for each actionHook available', async () => {
    const myMockAction = (param: string) => {
      expect(param).toBe('hello')
      jsStore.state.myData = param
    }
    const jsStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      actions: {
        myAction: myMockAction
      },
      hooks: {
        actions: {
          before (storeName: string, funcName: string, storeState: VRSState) {
            expect(storeName).toBe('my-store')
            expect(funcName).toBe('myAction')
            expect(storeState).toStrictEqual({
              myData: 'pouet',
              myData2: 'pouic'
            })
          },
          after (storeName: string, funcName: string, storeState: VRSState) {
            expect(storeName).toBe('my-store')
            expect(funcName).toBe('myAction')
            expect(storeState).toStrictEqual({
              myData: 'hello',
              myData2: 'pouic'
            })
          }
        }
      }
    }
    const reactiveStore = new VueReactiveStore(jsStore)
    expect(jsStore.actions.myAction).not.toBe(myMockAction)
    jsStore.actions.myAction('hello')
  })
  test('trigger a global plugin on a state (after) when a state property change', async () => {
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      }
    }
    const plugin = {
      state: {
        after: jest.fn()
      }
    }
    VueReactiveStore.registerPlugin(plugin)
    const reactiveStore = new VueReactiveStore(jsStore)
    jsStore.state.myData = 'hello'
    await Vue.nextTick()
    expect(plugin.state.after).toHaveBeenCalled()
    expect(plugin.state.after).toHaveBeenCalledWith('my-store', 'myData', 'hello', 'pouet')
  })
  test('trigger a global hook on a computed (after) when a computed property change', async () => {
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      computed: {
        myComputed () {
          return jsStore.state.myData + jsStore.state.myData2
        }
      }
    }
    const plugin = {
      computed: {
        after: jest.fn()
      }
    }
    VueReactiveStore.registerPlugin(plugin)
    const reactiveStore = new VueReactiveStore(jsStore)
    jsStore.state.myData = 'hello'
    await Vue.nextTick()
    expect(plugin.computed.after).toHaveBeenCalled()
    expect(plugin.computed.after).toHaveBeenCalledWith('my-store', 'myComputed', 'hellopouic', 'pouetpouic')
  })
  test('trigger a hook with the right name of store when it s a state property of a module', async () => {
    const module1: VRSStore = {
      name: 'module1',
      state: {
        myData: 'myData of module1',
        myData2: 'myData2 of module1'
      }
    }
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {},
      modules: {
        myComputed: module1
      }
    }
    const plugin = {
      state: {
        after: jest.fn()
      }
    }
    VueReactiveStore.registerPlugin(plugin)
    const reactiveStore = new VueReactiveStore(jsStore)
    module1.state.myData = 'hello'
    await Vue.nextTick()
    expect(plugin.state.after).toHaveBeenCalled()
    expect(plugin.state.after).toHaveBeenCalledWith('my-store.modules.module1', 'myData', 'hello', 'myData of module1')
  })
})
