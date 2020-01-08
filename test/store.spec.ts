// import 'jest';
import Vue from 'vue'
import { VueReactiveStore } from '../src/store'

// eslint-disable-next-line no-unused-vars
import { VRSStore, VRSStateTree, VRSHook, VRSPlugin } from '../src/types'

describe('VueReactiveStore', () => {
  test('has a register plugin function available', () => {
    expect(VueReactiveStore.registerPlugin).toBeDefined()
  })
  test('throw an error if no store is given in param', () => {
    expect(() => {
      // @ts-ignore
      // eslint-disable-next-line
      new VueReactiveStore()
    }).toThrow()
  })
  test('set default values for name and state if not provided', () => {
    const reactiveStore = new VueReactiveStore({ name: 'my-store' })
    expect(reactiveStore.name).toBe('my-store')
    // expect(reactiveStore.state).toEqual({})
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
        myComputed() {
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
      jsStore.state!.myData = param
    }
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      actions: {
        myAction: myMockAction
      },
      plugins: [
        {
          actions: {
            before(store: VRSStore, funcName: string, wrapperId: string) {
              expect(store.name).toBe('my-store')
              expect(funcName).toBe('my-store.actions.myAction')
              expect(store.state).toStrictEqual({
                myData: 'pouet',
                myData2: 'pouic'
              })
            },
            after(store: VRSStore, funcName: string, wrapperId: string) {
              expect(store.name).toBe('my-store')
              expect(funcName).toBe('my-store.actions.myAction')
              expect(store.state).toStrictEqual({
                myData: 'hello',
                myData2: 'pouic'
              })
            }
          }
        }
      ]
    }
    const reactiveStore = new VueReactiveStore(jsStore)
    expect(jsStore.actions!.myAction).not.toBe(myMockAction)
    jsStore.actions!.myAction('hello')
  })
  test('throw an error when a plugin is already registered', async () => {
    const plugin = {
      state: {
        after: jest.fn()
      }
    }
    const originalWarn = console.warn
    console.warn = jest.fn()
    VueReactiveStore.registerPlugin(plugin)
    VueReactiveStore.registerPlugin(plugin)
    expect(console.warn).toHaveBeenCalled()
    console.warn = originalWarn
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
    jsStore.state!.myData = 'hello'
    await Vue.nextTick()
    expect(plugin.state.after).toHaveBeenCalled()
    expect(plugin.state.after).toHaveBeenCalledWith(
      reactiveStore,
      'my-store.state.myData',
      'hello',
      'pouet'
    )
  })
  test('trigger a local plugin on a state (after) when a state property change', async () => {
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      plugins: [
        {
          state: {
            after: jest.fn()
          }
        }
      ]
    }
    const reactiveStore = new VueReactiveStore(jsStore)
    jsStore.state!.myData = 'hello'
    await Vue.nextTick()
    expect((jsStore.plugins![0] as VRSPlugin).state!.after).toHaveBeenCalled()
    expect((jsStore.plugins![0] as VRSPlugin).state!.after).toHaveBeenCalledWith(
      reactiveStore,
      'my-store.state.myData',
      'hello',
      'pouet'
    )
  })
  test('trigger a global hook on a computed (after) when a computed property change', async () => {
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      computed: {
        myComputed() {
          return <string>jsStore.state!.myData + <string>jsStore.state!.myData2
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
    jsStore.state!.myData = 'hello'
    await Vue.nextTick()
    expect(plugin.computed.after).toHaveBeenCalled()
    expect(plugin.computed.after).toHaveBeenCalledWith(
      reactiveStore,
      'my-store.computed.myComputed',
      'hellopouic',
      'pouetpouic'
    )
  })
  test('trigger a local hook on a computed (after) when a computed property change', async () => {
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      computed: {
        myComputed() {
          return <string>jsStore.state!.myData + <string>jsStore.state!.myData2
        }
      },
      plugins: [
        {
          computed: {
            after: jest.fn()
          }
        }
      ]
    }
    const reactiveStore = new VueReactiveStore(jsStore)
    jsStore.state!.myData = 'hello'
    await Vue.nextTick()
    expect((jsStore.plugins![0] as VRSPlugin).computed!.after).toHaveBeenCalled()
    expect((jsStore.plugins![0] as VRSPlugin).computed!.after).toHaveBeenCalledWith(
      reactiveStore,
      'my-store.computed.myComputed',
      'hellopouic',
      'pouetpouic'
    )
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
    module1.state!.myData = 'hello'
    await Vue.nextTick()
    expect(plugin.state.after).toHaveBeenCalled()
    expect(plugin.state.after).toHaveBeenCalledWith(
      reactiveStore,
      'my-store.modules.module1.state.myData',
      'hello',
      'myData of module1'
    )
  })
  test('trigger a watch correctly', () => {
    expect.assertions(2)
    const jsStore: VRSStore = {
      name: 'my-store',
      state: {
        myData: 'myData of module1'
      },
      watch: {
        myData(newValue, oldValue) {
          expect(oldValue).toBe('myData of module1')
          expect(newValue).toBe('hello')
        }
      }
    }
    const reactiveStore = new VueReactiveStore(jsStore)
    jsStore.state!.myData = 'hello'
  })
})
