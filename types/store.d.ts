import { ComputedOptions, WatchOptionsWithHandler, WatchHandler } from 'vue';
import { VRS, VRSHooks } from './typings';
/**
 * Vue Reactive Store,
 * based on VueJS reactivity system.
 * Inspired by VueX and VueJS instance.
 */
export declare class VueReactiveStore implements VRS {
    /**
     * Global hooks, called each time :
     * * an action is trigerred (before / after hooks)
     * * a property of the state is mutated (after hook)
     * * a computed property has been recomputed (after hook)
     * * a prop property has changed (after hook, mutated out of the store himself)
     * * a watch triger has been trigerred (after hook)
     */
    static globalHooks: VRSHooks[];
    name: string;
    _vm: any;
    state: {
        [name: string]: any;
    };
    actions: {
        [name: string]: Function;
    };
    computed: {
        [name: string]: (() => any) | ComputedOptions<any>;
    };
    watch: Record<string, string | WatchOptionsWithHandler<any> | WatchHandler<any>>;
    hooks: VRSHooks;
    modules: {
        [name: string]: VRS;
    };
    /**
     * Reactive store based on VueJS reactivity system
     *
     * @param {Object} store
     * The store, composed of :
     * * name of the store
     * * state
     * * computed
     * * actions
     * * watch
     * * props ?
     * * modules, aka sub-stores
     * * hooks ? aka functions executed when
     *   * actions are trigerred (before / after)
     *   * state is mutated (after)
     *   * computed properties are recomputed (after)
     *   * watchers are trigerred (before / after)
     *   * Each hook takes 4 params :
     *     * name of the reactive store
     *     * key, = name of the action, state or computed property
     *     * initialState / initialValue
     *     * finalState / finalValue
     */
    constructor(store: VRS);
}
