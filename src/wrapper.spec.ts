// import 'jest';
import { hookWrapper } from './wrapper'
// eslint-disable-next-line no-unused-vars
import { VRSState } from './typings'

describe('hookWrapper', () => {
  test('call the initial function without modifying params', async () => {
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const functionWrapped = hookWrapper(
      'store name',
      state,
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
    const state = {
      myData: 'pouet',
      myData2: 'pouic'
    }
    const functionWrapped = hookWrapper(
      'store name',
      state,
      'functionName',
      function (newMyData: string, newMyData2: string) {
        state.myData = newMyData
        state.myData2 = newMyData2
      },
      [
        {
          before (storeName: string, funcName: string, storeState: VRSState) {
            expect(storeName).toBe('store name')
            expect(storeState.myData).toBe('pouet')
            expect(storeState.myData2).toBe('pouic')
            expect(funcName).toBe('functionName')
          },
          after (storeName: string, funcName: string, storeState: VRSState) {
            expect(storeName).toBe('store name')
            expect(storeState.myData).toBe('hi')
            expect(storeState.myData2).toBe('ho')
            expect(funcName).toBe('functionName')
          }

        }
      ]
    )
    await functionWrapped('hi', 'ho')
  })
})
