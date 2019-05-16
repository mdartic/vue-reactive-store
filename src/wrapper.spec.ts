// import 'jest';
import { hookWrapper } from './wrapper'
// eslint-disable-next-line no-unused-vars
import { VRSState, VRSStore } from './typings'

describe('hookWrapper', () => {
  test('call the initial function without modifying params', async () => {
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
    await functionWrapped('hi', 'ho')
  })
  test('call before/after hooks with right params', async () => {
    let wrapperIdBeforeHook: string = ''
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
    await functionWrapped('hi', 'ho')
  })
})
