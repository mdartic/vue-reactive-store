// import 'jest';
import { VueReactiveStore } from './store'

describe('VueReactiveStore', () => {
  test('has global hooks available', () => {
    expect(VueReactiveStore.globalHooks).toBeDefined()
  })
  test('and the array is empty', () => {
    expect(VueReactiveStore.globalHooks.length).toBe(0)
  })
  test('build a reactive store with a state sharing the same reference', () => {
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
    expect(store.hooks).toStrictEqual({})
    expect(store.modules).toStrictEqual({})
  })
})
