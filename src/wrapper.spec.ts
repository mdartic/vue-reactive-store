// import 'jest';
import { hookWrapper } from './wrapper'
// eslint-disable-next-line no-unused-vars
import { VRSState, VRSStore } from './typings'

describe('hookWrapper', () => {
  test('call the initial function without modifying params', () => {
    expect.assertions(2)
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const functionWrapped = hookWrapper({
      name: 'store name',
      state
    },
    'functionName',
    function (newMyData: string, newMyData2: string) {
      expect(newMyData).toBe('hi')
      expect(newMyData2).toBe('ho')
      state.myData = newMyData
      state.myData2 = newMyData2
    },
    []
    )
    functionWrapped('hi', 'ho')
  })
  test('call before/after hooks with right params', () => {
    expect.assertions(9)
    let wrapperIdBeforeHook = 'this is a wrapper id'
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const functionWrapped = hookWrapper({
      name: 'store name',
      state
    },
    'functionName',
    function (newMyData: string, newMyData2: string) {
      state.myData = newMyData
      state.myData2 = newMyData2
    },
    [
      {
        before (store: VRSStore, funcName: string, wrapperId: string) {
          expect(store.name).toBe('store name')
          expect(store.state!.myData).toBe('pouet')
          expect(store.state!.myData2).toBe('pouic')
          expect(funcName).toBe('functionName')
          wrapperIdBeforeHook = wrapperId
        },
        after (store: VRSStore, funcName: string, wrapperId: string) {
          expect(store.name).toBe('store name')
          expect(store.state!.myData).toBe('hi')
          expect(store.state!.myData2).toBe('ho')
          expect(funcName).toBe('functionName')
          expect(wrapperId).toBe(wrapperIdBeforeHook)
        }
      }
    ]
    )
    functionWrapped('hi', 'ho')
  })
  test('call before/after hooks with right params when action is async', async () => {
    expect.assertions(9)
    let wrapperIdBeforeHook = ''
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const functionWrapped = hookWrapper({
      name: 'store name',
      state
    },
    'functionName',
    function (newMyData: string, newMyData2: string) {
      return new Promise((resolve) => {
        state.myData = newMyData
        state.myData2 = newMyData2
        setTimeout(resolve, 1000)
      })
    },
    [
      {
        before (store: VRSStore, funcName: string, wrapperId: string) {
          expect(store.name).toBe('store name')
          expect(store.state!.myData).toBe('pouet')
          expect(store.state!.myData2).toBe('pouic')
          expect(funcName).toBe('functionName')
          wrapperIdBeforeHook = wrapperId
        },
        after (store: VRSStore, funcName: string, wrapperId: string) {
          expect(store.name).toBe('store name')
          expect(store.state!.myData).toBe('hi')
          expect(store.state!.myData2).toBe('ho')
          expect(funcName).toBe('functionName')
          expect(wrapperId).toBe(wrapperIdBeforeHook)
        }
      }
    ]
    )
    await functionWrapped('hi', 'ho')
  })
})
