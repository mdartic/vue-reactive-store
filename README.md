## vue-reactive-store

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
* **watchers** that could react to state / computed evolutions (same as `watch` for Vue.js instance)
* **hooks**, trigerred for state evolution, computed properties, actions / watchers trigerred
* **modules**, aka sub-stores, work in progress
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
  hooks: {
    actions: {
      after(storeName, actionName, storeState) {
        console.log('action is finished, this is my store : ', storeState)
      }
    }
  }
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

### Next episodes

* finishing blog articles (FR)
* extend the code coverage
* release a plugin for log every mutation / action call / watch / ...
* release a plugin for storing data in localStorage
* listen to community needs
