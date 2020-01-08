// import 'jest';
import Vue from 'vue'
import { createStore } from '../src/store'

// eslint-disable-next-line no-unused-vars
import { VRSStore, VRSHook, VRSPlugin, VRSStateTree } from '../src/types'

describe('createStore', () => {
  test('throw an error if no store is given in param', () => {
    expect(() => {
      // @ts-ignore
      createStore()
    }).toThrow()
  })
  test('set default values for name and state if not provided', () => {
    const reactiveStore = createStore({
      name: 'my-store'
    })
    expect(reactiveStore.name).toBe('my-store')
  })
  test('is built with a JS Object with a state sharing the same reference than VRS Store', () => {
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const store = createStore({
      name: 'my-store',
      state
    })
    expect(store.name).toBe('my-store')
    expect(store.state).toBe(state)
  })
  test('can be mutated directly and the state of VRS Store is equal', () => {
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const store = createStore({
      name: 'my-store',
      state
    })
    state.myData = 'hello'
    expect(state.myData).toBe('hello')
    expect(store.state!.myData).toBe('hello')
    expect(state.myData).toBe(store.state!.myData)
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
    const store = createStore(jsStore)
    expect(store.modules!.module1.state).toBe(module1.state)
    // @ts-ignore
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
      const reactiveStore = createStore(jsStore)
    }).toThrow()
  })

  /**
   * Hooks testing
   */
  test('call hookWrapper for each actionHook available', async () => {
    expect.assertions(8)
    const myMockAction = (param: string) => {
      expect(param).toBe('hello')
      store.state!.myData = param
    }
    const store = createStore({
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
    })

    expect(store.actions!.myAction).not.toBe(myMockAction)
    store.actions!.myAction('hello')
  })

  test('trigger a local plugin on a state (after) when a state property change', async () => {
    const store = createStore({
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
    })
    store.state!.myData = 'hello'
    await Vue.nextTick()
    expect((store.plugins![0] as VRSPlugin).state!.after).toHaveBeenCalled()
    expect((store.plugins![0] as VRSPlugin).state!.after).toHaveBeenCalledWith(
      store,
      'my-store.state.myData',
      'hello',
      'pouet'
    )
  })

  test('trigger a global hook on a computed (after) when a computed property change', async () => {
    const jsStore = {
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
    const reactiveStore = createStore(jsStore)
    jsStore.state!.myData = 'hello'
    await Vue.nextTick()
    expect(reactiveStore.plugins![0].computed.after).toHaveBeenCalled()
    expect(reactiveStore.plugins![0].computed.after).toHaveBeenCalledWith(
      reactiveStore,
      'my-store.computed.myComputed',
      'hellopouic',
      'pouetpouic'
    )
  })

  test('trigger a local hook on a computed (after) when a computed property change', async () => {
    const store = {
      name: 'my-store',
      state: {
        myData: 'pouet',
        myData2: 'pouic'
      },
      computed: {
        myComputed(): string {
          return store.state!.myData + store.state!.myData2
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
    const reactiveStore = createStore(store)
    store.state!.myData = 'hello'

    await Vue.nextTick()

    expect(store.plugins![0].computed!.after).toHaveBeenCalled()
    expect(store.plugins![0].computed!.after).toHaveBeenCalledWith(
      store,
      'my-store.computed.myComputed',
      'hellopouic',
      'pouetpouic'
    )
  })

  test('trigger a hook with the right name of store when it s a state property of a module', async () => {
    const module1 = {
      name: 'module1',
      state: {
        myData: 'myData of module1',
        myData2: 'myData2 of module1'
      }
    }
    const jsStore = {
      name: 'my-store',
      state: {},
      modules: {
        myComputed: module1
      },
      plugins: [
        {
          state: {
            after: jest.fn()
          }
        }
      ]
    }
    const reactiveStore = createStore(jsStore)
    module1.state!.myData = 'hello'
    await Vue.nextTick()
    expect(reactiveStore.plugins![0].state.after).toHaveBeenCalled()
    expect(reactiveStore.plugins![0].state.after).toHaveBeenCalledWith(
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
    const reactiveStore = createStore(jsStore)
    jsStore.state!.myData = 'hello'
  })

  test('check that the state is reactive right after the creation', () => {
    const jsStore = {
      name: 'vrs-store',
      state: {
        myData: 'this is my data'
      }
    }
    const myDataFn = () => jsStore.state.myData
    const myDataConst = jsStore.state.myData
    const vrsStore = createStore(jsStore)

    expect(jsStore.state.myData).toBe('this is my data')
    expect(vrsStore.state!.myData).toBe('this is my data')
    expect(myDataConst).toBe('this is my data')
    expect(myDataFn()).toBe('this is my data')

    // mute the state
    vrsStore.state!.myData = 'hello world'

    // now all the pointers must be hello world, except myDataConst
    expect(jsStore.state.myData).toBe('hello world')
    expect(vrsStore.state!.myData).toBe('hello world')
    expect(myDataFn()).toBe('hello world')
    expect(myDataConst).toBe('this is my data')
  })

  test('check that the computed is reactive right after the creation', () => {
    const jsStore = {
      name: 'vrs-store',
      state: {
        myData: 'this is my data'
      },
      computed: {
        myDataEnhanced: () => jsStore.state.myData + ' yeepee !'
      }
    }
    const myDataEnhancedRef = jsStore.computed.myDataEnhanced
    const vrsStore = createStore(jsStore)

    expect(typeof jsStore.computed.myDataEnhanced).toBe('function')
    expect(typeof vrsStore.computed!.myDataEnhanced).toBe('function')
    expect(typeof myDataEnhancedRef).toBe('function')
    expect(jsStore.computed.myDataEnhanced()).toBe('this is my data' + ' yeepee !')
    expect(vrsStore.computed!.myDataEnhanced()).toBe('this is my data' + ' yeepee !')
    expect(myDataEnhancedRef()).toBe('this is my data' + ' yeepee !')

    // mute the state
    vrsStore.state!.myData = 'hello world'

    // now all the computed must be "hello world yeepee !"
    expect(jsStore.computed.myDataEnhanced()).toBe('hello world' + ' yeepee !')
    expect(vrsStore.computed!.myDataEnhanced()).toBe('hello world' + ' yeepee !')
    expect(myDataEnhancedRef()).toBe('hello world' + ' yeepee !')
  })
})
