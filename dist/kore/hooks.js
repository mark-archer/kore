"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistentValue = exports.useOnScreen = exports.useSubscription = exports.useObservableArrayState = exports.useObservableState = exports.usePromise = exports.useObservable = void 0;
const knockout_1 = require("knockout");
const react_1 = require("react");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
/**
 * Use this to subscribe to an observable or computed in a functional component.
 * @param sub the observable or computed to subscribe to
 * @param deps an array of dependencies to pass to useEffect which will trigger a re-render when any of the dependencies change
 * @returns the current value of the observable or computed and a function to set the value
 */
function useObservable(sub, deps = []) {
    const [data, setData] = (0, react_1.useState)(() => (0, knockout_1.unwrap)(sub));
    (0, react_1.useEffect)(() => {
        if (!(0, knockout_1.isSubscribable)(sub)) {
            return;
        }
        const subscription = sub.subscribe(() => {
            const newData = sub();
            // @ts-ignore
            if ((0, lodash_1.isArray)(newData) && newData === data) {
                // @ts-ignore
                setData([...newData]);
            }
            else {
                setData(newData);
            }
        });
        // the data might change _after_ useObservable is called but _before_ the subscription has been created
        // this checks for that and updates the state with the new data if necessary
        const newData = sub();
        if (!(0, lodash_1.isEqual)(data, newData)) {
            setData(newData);
        }
        return () => subscription.dispose();
    }, deps);
    return [data, newData => {
            setData(newData);
            if ((0, knockout_1.isSubscribable)(sub)) {
                sub(newData);
            }
        }];
}
exports.useObservable = useObservable;
/**
 * Use this to easily wait for a promise in a functional component.
 * @param p The promise to wait for
 * @param initialValue the initial value to return before the promise resolves
 * @param deps the dependencies to pass to useEffect which will trigger a re-render when any of the dependencies change
 * @returns the initial value and the resolved value of the promise
 */
function usePromise(p, initialValue, deps = []) {
    const [data, setData] = (0, react_1.useState)(initialValue);
    (0, react_1.useEffect)(() => {
        let disposed = false;
        if (typeof p === 'function') {
            p = p();
        }
        p.then(newData => {
            // if (!_.isEqual(newData, data) && !disposed) {
            if (!disposed) {
                setData(newData);
            }
        });
        return () => {
            disposed = true;
        };
    }, deps);
    return data;
}
exports.usePromise = usePromise;
/**
 * Use this to create an observable in a functional component.
 * This automatically subscribes to the observable and triggers a re-render when the value changes.
 * @param initialValue This will be the initial value of the observable
 * @param doNotSubscribe If true, the observable will not be subscribed to automatically.
 * This is useful if you want to create an observable that persists between rerenders but doesn't cause rerenders itself.
 * @returns
 */
function useObservableState(initialValue, doNotSubscribe) {
    const [obs] = (0, react_1.useState)(() => (0, knockout_1.observable)(initialValue));
    if (!doNotSubscribe) {
        useObservable(obs);
    }
    return obs;
}
exports.useObservableState = useObservableState;
/**
 * Same as useObservableState but for observable arrays
 */
function useObservableArrayState(initialValue, doNotSubscribe) {
    const [obs] = (0, react_1.useState)(() => (0, knockout_1.observableArray)(initialValue !== null && initialValue !== void 0 ? initialValue : []));
    if (!doNotSubscribe) {
        useObservable(obs);
    }
    return obs;
}
exports.useObservableArrayState = useObservableArrayState;
/**
 * Use this to register a handler for a knockout subscribable in a functional component.
 * The handler will be called immediately and whenever the subscribable changes.
 * @param subscribable The observable to subscribe to
 * @param onChange The function to call with the new value when the observable changes
  */
function useSubscription(subscribable, onChange, doNotCallOnChangeDuringSetup) {
    if (!doNotCallOnChangeDuringSetup) {
        (0, react_1.useEffect)(() => onChange(subscribable()), []);
    }
    (0, react_1.useEffect)(() => {
        const subscription = subscribable.subscribe(() => onChange(subscribable()));
        return () => subscription.dispose();
    }, [subscribable, onChange]);
}
exports.useSubscription = useSubscription;
function useOnScreen(ref) {
    const [isIntersecting, setIntersecting] = (0, react_1.useState)(false);
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));
    (0, react_1.useEffect)(() => {
        observer.observe(ref.current);
        // Remove the observer as soon as the component is unmounted
        return () => { observer.disconnect(); };
    }, []);
    return isIntersecting;
}
exports.useOnScreen = useOnScreen;
/**
 * This creates an observable that will automatically persist its value between page reloads using localStorage.
 * If localStorage is not available, the observable will not persist its value.
 * @param initialValue the initial value of the observable
 * @param globalName the name to use when storing the value in localStorage
 * @returns the observable that will persist between page reloads
 */
function persistentValue(initialValue, globalName) {
    let q = (0, knockout_1.observable)();
    if (typeof localStorage === 'undefined') {
        return q;
    }
    q.subscribe(newVal => {
        localStorage.setItem(globalName, JSON.stringify((0, utils_1.toJSON)(newVal)));
    });
    const existing = localStorage.getItem(globalName);
    if (existing) {
        q((0, utils_1.fromJSON)(JSON.parse(existing)));
    }
    else {
        q(initialValue);
    }
    return q;
}
exports.persistentValue = persistentValue;
//# sourceMappingURL=hooks.js.map