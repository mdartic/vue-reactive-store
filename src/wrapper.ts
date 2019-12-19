import Vue from 'vue'

// eslint-disable-next-line no-unused-vars
import { VRSHook, VRSStore } from './typings'

function uuidv4 () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0; var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Wrapper for action,
 * allow for trigger hooks
 */
export const hookWrapper = (
  store: VRSStore,
  key: string,
  func: Function,
  hooks: VRSHook[]
) => async (...args: any[]) => {
  const wrapperId = uuidv4()
  // wait for initial mutation of store
  // await Vue.nextTick()

  return new Promise((resolve, reject) => {
    // call all before hooks
    // and memorize result to pass it to the after hook
    hooks.forEach(hook => {
      hook.before && hook.before(store, key, wrapperId)
    })

    // we call the initial function with parameters
    // if it's a promise, we will use await on it
    // const funcResult: Promise<{}>|{} = func(...args)
    // if (funcResult instanceof Promise) {
    //   await funcResult
    // }

    // we wait for the next DOM update (and so the state mutations)
    // await Vue.nextTick()
    // we call the initial function with parameters
    const fnRes = func(...args)
    if (fnRes && typeof fnRes.then === 'function') {
    // it's probably a promise, we work async
      fnRes.then(async (result: any) => {
        // we wait for the next DOM update (and so the state mutations)
        await Vue.nextTick()

        // call all after hooks
        hooks.forEach(hook => {
          hook.after && hook.after(store, key, wrapperId)
        })
        resolve(result)
      }).catch(async (error: Error) => {
        // we wait for the next DOM update (and so the state mutations)
        await Vue.nextTick()

        // call all after hooks
        hooks.forEach(hook => {
          hook.after && hook.after(store, key, wrapperId)
        })
        reject(error)
      })
    } else {
      resolve(fnRes)
    }
  })
}
