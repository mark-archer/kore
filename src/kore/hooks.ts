
import { isSubscribable, observable, observableArray, Subscribable, unwrap } from 'knockout';
import React, { useState, useEffect } from 'react';
import { isArray, isEqual } from 'lodash';
import { fromJSON, toJSON } from '../utils';

/**
 * Use this to subscribe to an observable or computed in a functional component.
 * @param sub the observable or computed to subscribe to
 * @param deps an array of dependencies to pass to useEffect which will trigger a re-render when any of the dependencies change
 * @returns the current value of the observable or computed and a function to set the value
 */
export function useObservable<T>(sub: Subscribable<T> | T, deps: React.DependencyList = []): [T, (value: T) => void] {
  const [data, setData] = useState(() => unwrap(sub));
  useEffect(() => {
    if (!isSubscribable(sub)) {
      return;
    }
    const subscription = sub.subscribe(() => {
      const newData = sub();
      // @ts-ignore
      if (isArray(newData) && newData === data) {
        // @ts-ignore
        setData([...newData])
      } else {
        setData(newData)      
      }
    })
    // the data might change _after_ useObservable is called but _before_ the subscription has been created
    // this checks for that and updates the state with the new data if necessary
    const newData = sub();
    if (!isEqual(data, newData)) {
      setData(newData);
    }
    return () => subscription.dispose();
  }, deps);

  return [data, newData => {
    setData(newData);
    if (isSubscribable(sub)) {
      sub(newData);
    }
  }];
}

/**
 * Use this to easily wait for a promise in a functional component.
 * @param p The promise to wait for
 * @param initialValue the initial value to return before the promise resolves
 * @param deps the dependencies to pass to useEffect which will trigger a re-render when any of the dependencies change
 * @returns the initial value and the resolved value of the promise
 */
export function usePromise<T>(p: Promise<T> | (() => Promise<T>), initialValue?: T, deps: React.DependencyList = []): T | undefined {
  const [data, setData] = useState(initialValue);
  useEffect(() => {
    let disposed = false;
    if (typeof p === 'function') {
      p = p();
    }
    p.then(newData => {
      // if (!_.isEqual(newData, data) && !disposed) {
      if (!disposed) {
        setData(newData)
      }
    })
    return () => { 
      disposed = true; 
    }
  }, deps);
  return data;
}

/**
 * Use this to create an observable in a functional component. 
 * This automatically subscribes to the observable and triggers a re-render when the value changes.
 * @param initialValue This will be the initial value of the observable
 * @param doNotSubscribe If true, the observable will not be subscribed to automatically.  
 * This is useful if you want to create an observable that persists between rerenders but doesn't cause rerenders itself.
 * @returns 
 */
export function useObservableState<T>(initialValue?: T, doNotSubscribe?: boolean) {
  const [obs] = useState(() => observable(initialValue));
  if (!doNotSubscribe) {
    useObservable(obs);
  }
  return obs;
}

/**
 * Same as useObservableState but for observable arrays
 */
export function useObservableArrayState<T=any>(initialValue?: T[], doNotSubscribe?: boolean) {
  const [obs] = useState(() => observableArray(initialValue ?? []));
  if (!doNotSubscribe) {
    useObservable(obs);
  }
  return obs;
}

/**
 * Use this to register a handler for a knockout subscribable in a functional component.
 * The handler will be called immediately and whenever the subscribable changes. 
 * @param subscribable The observable to subscribe to
 * @param onChange The function to call with the new value when the observable changes
  */
export function useSubscription<T>(subscribable: Subscribable<T>, onChange: (value: T) => any, doNotCallOnChangeDuringSetup?: boolean): void {
  if (!doNotCallOnChangeDuringSetup) {
    useEffect(() => onChange(subscribable()), []);
  }
  useEffect(() => {
    const subscription = subscribable.subscribe(() => onChange(subscribable()));
    return () => subscription.dispose();
  }, [subscribable, onChange]);
}

export function useOnScreen(ref: React.RefObject<any>) {
  const [isIntersecting, setIntersecting] = useState(false)

  const observer = new IntersectionObserver(
    ([entry]) => setIntersecting(entry.isIntersecting)
  )

  useEffect(() => {
    observer.observe(ref.current)
    // Remove the observer as soon as the component is unmounted
    return () => { observer.disconnect() }
  }, [])

  return isIntersecting
}

/**
 * This creates an observable that will automatically persist its value between page reloads using localStorage.
 * If localStorage is not available, the observable will not persist its value.
 * @param initialValue the initial value of the observable
 * @param globalName the name to use when storing the value in localStorage
 * @returns the observable that will persist between page reloads
 */
export function persistentValue<T>(initialValue: T, globalName: string): ko.Observable<T | undefined> {
  let q = observable<T>();
  if (typeof localStorage === 'undefined') {
    return q;
  }
  q.subscribe(newVal => {
    localStorage.setItem(globalName, JSON.stringify(toJSON(newVal)))
  })
  const existing = localStorage.getItem(globalName);
  if (existing) {
    q(fromJSON(JSON.parse(existing)))
  } else {
    q(initialValue);
  }
  return q;
}
