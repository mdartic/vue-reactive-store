## vue-reactive-store

![](https://gitlab.com/mad-z/vue-reactive-store-ci-cd/badges/master/pipeline.svg)
![](https://gitlab.com/mad-z/vue-reactive-store-ci-cd/badges/master/coverage.svg)

*Vue.js* (only) library for **managing a centralized state**, inspired by Vue.js and VueX.

Without `mutations`, and with async `actions` mutating directly the state.

This library is for the moment a personal project, written in TypeScript
for better discoverability / maintenability.

**It's not made for production use !... (for the moment)**

I'm currently writing a French blog article to explain the use cases.

If feedbacks are goods, I'll write a better documentation :-)
with english examples and take care of this library.

### Core concepts

`vue-reactive-store` is a library trying to make easier
the centralization of your app's data.

A store is composed of :
* a **name**
* a **state**, that will evolve in time (think the `data` of a Vue.js instance)
* **computed** properties based on this state (think the `computed` of a Vue.js instance, or the `getters` for VueX)
* **actions** that will make API calls, mutate the state, ... (think `actions` for VueX, but with `mutations` inside)
* **watch(ers)** that could react to state / computed evolutions (same as `watch` for Vue.js instance)
* **plugins**, trigerred for state evolution, computed properties, actions / watchers trigerred
* **modules**, aka sub-stores, namespaced
* ***props***, like Vue.js instances, but, just an idea for the moment

### How to use it

I hope the use of TypeScript will benefit for better understanding.

First, install `vue-reactive-store` in your Vue.js app.

```
npm i vue-reactive-store
```

Add a store as a JS object, and transform it by creating
a `VueReactiveStore` instance.

```js
// src/store.js
import VueReactiveStore from 'vue-reactive-store'

const store = {
  state: {
    loading: false,
    error: null,
    data: null
  },
  computed: {
    myCurrentState() {
      if (store.state.loading === true) return 'is loading...'
      if (store.state.error) return 'error...'
      return 'store seems ok'
    }
  },
  actions: {
    async fetchData() {
      store.state.loading = true
      try {
        // make api call
        const response = await myApi.fetchSomeData()
        store.state.data = response
      } catch (e) {
        store.state.error = e
      }
      store.state.loading = false
    }
  },
  plugins: [{
    actions: {
      after(storeName, actionName, storeState) {
        console.log('action is finished, this is my store : ', storeState)
      }
    }
  }]
}

const reactiveStore = new VueReactiveStore(store)

export default store
```

Finally, use it in your components by importing the store,
and put the data that interest you in the `data` and `computed`
part of your app.

```vue
// src/components/myComponent.js
<template>
  <div>
    {{ myCurrentState }}
    <div v-if="!state.loading">
      Data : {{ state.data }}
    </div>
    <div v-if="state.error">
      {{ state.error }}
    </div>
  </div>
</template>

<script>
import store from '../store'

export default {
  data: {
    state: store.state
  },
  computed: store.computed,
  created() {
    store.actions.fetchData()
  }
}
</script>
```

That sould do the trick, now your store is reactive,
and you could use it in all the component you want by importing
this object.
But, don't import it everywhere, just use it in your 'top-level'
components to facilitate your project maintenability...

### Logger plugin

There is a logger plugin that logs 
* each action trigerred (before / after)
* each mutation on the state (after)
* each computed property recomputed (after)

To use it, you can do like this :

```js
// src/store.js
import VueReactiveStore from 'vue-reactive-store'
import VRSPluginLogger from 'vue-reactive-store/dist/index.esm'

const store = {
  state: {
    loading: false,
    error: null,
    data: null
  },
  computed: {
    myCurrentState() {
      if (store.state.loading === true) return 'is loading...'
      if (store.state.error) return 'error...'
      return 'store seems ok'
    }
  },
  actions: {
    async fetchData() {
      store.state.loading = true
      try {
        // make api call
        const response = await myApi.fetchSomeData()
        store.state.data = response
      } catch (e) {
        store.state.error = e
      }
      store.state.loading = false
    }
  }
}

VueReactiveStore.registerPlugin(VRSPluginLogger);

const reactiveStore = new VueReactiveStore(store)

// this call will fetch data
// and the VRSPluginLogger will log
// * the action trigerred (before)
// * the state mutations (after)
// * the computed properties (after)
// * the end of the action (after)
store.actions.fetchData()

export default store
```

You can also decide to just log action / state / computed without previous/next state.

```js
// by default all are true and so are verbose logs
VRSPluginLogger.logSettings.actions = false;
VRSPluginLogger.logSettings.computed = false;
VRSPluginLogger.logSettings.state = false;
```


### Next episodes

* finishing blog articles (FR)
* release a plugin for storing data in localStorage
* release a plugin for history (undo / redo)
* listen to community needs
