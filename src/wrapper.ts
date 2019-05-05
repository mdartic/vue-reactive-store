import Vue from 'vue'

// eslint-disable-next-line no-unused-vars
import { VRSHook } from './typings'

/**
 * Wrapper for action,
 * allow for trigger hooks
 */
export const hookWrapper = (
  storeName: string,
  storeState: {
    [name: string]: any,
  },
  funcName: string,
  func: Function,
  hooks: VRSHook[]
) => async (...args: any) => {
  // wait for initial mutation of store
  await Vue.nextTick()

  // call all before hooks
  hooks.forEach(hook => {
    if (hook.before) hook.before(storeName, funcName, storeState)
  })

  // we call the initial function with parameters
  await func(...args)

  // we wait for the next DOM update (and so the state mutations)
  await Vue.nextTick()

  // call all after hooks
  hooks.forEach(hook => {
    if (hook.after) hook.after(storeName, funcName, storeState)
  })
}
