"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistentValue = exports.useOnScreen = exports.useSubscription = exports.useObservableArrayState = exports.useObservableState = exports.usePromise = exports.useObservable = void 0;
const knockout_1 = require("knockout");
const react_1 = require("react");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
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
function useObservableState(initialValue) {
    const [obs] = (0, react_1.useState)(() => (0, knockout_1.observable)(initialValue));
    useObservable(obs);
    return obs;
}
exports.useObservableState = useObservableState;
function useObservableArrayState(initialValue) {
    const [obs] = (0, react_1.useState)(() => (0, knockout_1.observableArray)(initialValue));
    useObservable(obs);
    return obs;
}
exports.useObservableArrayState = useObservableArrayState;
function useSubscription(subscribable, onChange) {
    // hacky, makes sure subscription is called on initial load, this might not be what the user is expecting
    (0, react_1.useEffect)(() => onChange(subscribable()), []);
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
function persistentValue(initialValue, globalName) {
    let q = (0, knockout_1.observable)();
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
//# sourceMappingURL=kore-hooks.js.map