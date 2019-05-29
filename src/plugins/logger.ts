// eslint-disable-next-line no-unused-vars
import { VRSPlugin, VRSState, VRSComputed, VRSStore, VRSPluginFunction } from '../typings'

interface VRSPluginLogger extends VRSPlugin {
  previousValues: {
    state: VRSState,
    computed: VRSComputed
  }
}

interface VRSPluginLoggerOptions {
  state: boolean,
  computed: boolean,
  actions: boolean
}

const loggerPlugin = (options: VRSPluginLoggerOptions = {
  state: true,
  computed: true,
  actions: true
}): VRSPluginFunction => (store: VRSStore): VRSPluginLogger => {
  const previousValues: {
    state: VRSState,
    computed: VRSComputed
  } = {
    state: {},
    computed: {}
  }
  return {
    previousValues: {
      state: {},
      computed: {}
    },
    state: {
      after (store, stateProperty, newValue, oldValue) {
        const message = `${stateProperty} updated`
        previousValues.state = JSON.parse(JSON.stringify(store.state))
        previousValues.computed = JSON.parse(JSON.stringify(store.computed))
        if (options.state) {
          const newValueDisplay = typeof newValue === 'object' ? JSON.parse(JSON.stringify(newValue)) : newValue
          let oldValueDisplay = {}
          if (previousValues.state[`${store.name}.${stateProperty}`]) {
            oldValueDisplay = previousValues.state[`${store.name}.${stateProperty}`]
          } else {
            oldValueDisplay = typeof oldValue === 'object' ? JSON.parse(JSON.stringify(oldValue)) : oldValue
          }
          previousValues.state[`${store.name}.${stateProperty}`] = typeof newValue === 'object' ? JSON.parse(JSON.stringify(newValue)) : newValue
          console.groupCollapsed(message)
          console.log('%cprevious value', 'color: blue', oldValueDisplay)
          console.log('%cnext value', 'color: green', newValueDisplay)
          console.groupEnd()
        } else {
          console.info(`%c${message}`, 'color: green')
        }
      }
    },
    computed: {
      after (store, computedProperty, newValue, oldValue) {
        const message = `${computedProperty} updated`
        previousValues.state = JSON.parse(JSON.stringify(store.state))
        previousValues.computed = JSON.parse(JSON.stringify(store.computed))
        if (options.computed) {
          const newValueDisplay = typeof newValue === 'object' ? JSON.parse(JSON.stringify(newValue)) : newValue
          const oldValueDisplay = typeof oldValue === 'object' ? JSON.parse(JSON.stringify(oldValue)) : oldValue
          console.groupCollapsed(message)
          console.log('computed from > to')
          console.log(oldValueDisplay)
          console.log(newValueDisplay)
          console.groupEnd()
        } else {
          console.info(`%c${message}`, 'color: green')
        }
      }
    },
    actions: {
      before (store, actionName, wrapperId) {
        const message = `${actionName} trigerred [${wrapperId}]`
        previousValues.state = JSON.parse(JSON.stringify(store.state))
        previousValues.computed = JSON.parse(JSON.stringify(store.computed))
        if (options.actions) {
          console.groupCollapsed(message)
          console.groupCollapsed('trace')
          console.trace()
          console.groupEnd()
          console.groupEnd()
        } else {
          console.info(`%c${message}`, 'color: blue')
        }
      },
      after (store, actionName, wrapperId) {
        const message = `${actionName} finished [${wrapperId}]`
        previousValues.state = JSON.parse(JSON.stringify(store.state))
        previousValues.computed = JSON.parse(JSON.stringify(store.computed))
        if (options.actions) {
          console.groupCollapsed(message)
          console.groupCollapsed('trace')
          console.trace()
          console.groupEnd()
          console.groupEnd()
        } else {
          console.info(`%c${message}`, 'color: blue')
        }
      }
    }
  }
}

export default loggerPlugin
