// eslint-disable-next-line no-unused-vars
import { VRSPlugin, VRSState, VRSComputed } from '../typings'

interface VRSPluginLogger extends VRSPlugin {
  logSettings: {
    state: boolean,
    computed: boolean,
    actions: boolean
  }
  previousValues: {
    state: VRSState,
    computed: VRSComputed
  }
}

const loggerPlugin: VRSPluginLogger = {
  logSettings: {
    state: true,
    computed: true,
    actions: true
  },
  previousValues: {
    state: {},
    computed: {}
  },
  state: {
    after (store, stateProperty, newValue, oldValue) {
      const message = `${stateProperty} updated`
      loggerPlugin.previousValues.state = JSON.parse(JSON.stringify(store.state))
      loggerPlugin.previousValues.computed = JSON.parse(JSON.stringify(store.computed))
      if (loggerPlugin.logSettings.state) {
        const newValueDisplay = typeof newValue === 'object' ? JSON.parse(JSON.stringify(newValue)) : newValue
        let oldValueDisplay = {}
        if (loggerPlugin.previousValues.state[`${store.name}.${stateProperty}`]) {
          oldValueDisplay = loggerPlugin.previousValues.state[`${store.name}.${stateProperty}`]
        } else {
          oldValueDisplay = typeof oldValue === 'object' ? JSON.parse(JSON.stringify(oldValue)) : oldValue
        }
        loggerPlugin.previousValues.state[`${store.name}.${stateProperty}`] = typeof newValue === 'object' ? JSON.parse(JSON.stringify(newValue)) : newValue
        console.groupCollapsed(message)
        console.log('state from > to')
        console.log(oldValueDisplay)
        console.log(newValueDisplay)
        console.groupEnd()
      } else {
        console.info(`%c${message}`, 'color: green')
      }
    }
  },
  computed: {
    after (store, computedProperty, newValue, oldValue) {
      const message = `${computedProperty} updated`
      loggerPlugin.previousValues.state = JSON.parse(JSON.stringify(store.state))
      loggerPlugin.previousValues.computed = JSON.parse(JSON.stringify(store.computed))
      if (loggerPlugin.logSettings.computed) {
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
      loggerPlugin.previousValues.state = JSON.parse(JSON.stringify(store.state))
      loggerPlugin.previousValues.computed = JSON.parse(JSON.stringify(store.computed))
      if (loggerPlugin.logSettings.actions) {
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
      loggerPlugin.previousValues.state = JSON.parse(JSON.stringify(store.state))
      loggerPlugin.previousValues.computed = JSON.parse(JSON.stringify(store.computed))
      if (loggerPlugin.logSettings.actions) {
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
