
import { isSubscribable, observable, observableArray, Subscribable, unwrap } from 'knockout';
import React, { useState, useEffect } from 'react';
import { isArray, isEqual } from 'lodash';
import { fromJSON, toJSON } from '../utils';

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

export function useObservableState<T>(initialValue?: T) {
  const [obs] = useState(() => observable(initialValue));
  useObservable(obs);
  return obs;
}

export function useObservableArrayState<T=any>(initialValue?: T[]) {
  const [obs] = useState(() => observableArray(initialValue ?? []));
  useObservable(obs);
  return obs;
}

export function useSubscription<T>(subscribable: Subscribable<T>, onChange: (value: T) => any) {
  // hacky, makes sure subscription is called on initial load, this might not be what the user is expecting
  useEffect(() => onChange(subscribable()), []);
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
