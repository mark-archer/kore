import { Subscribable } from 'knockout';
import React from 'react';
/**
 * Use this to subscribe to an observable or computed in a functional component.
 * @param sub the observable or computed to subscribe to
 * @param deps an array of dependencies to pass to useEffect which will trigger a re-render when any of the dependencies change
 * @returns the current value of the observable or computed and a function to set the value
 */
export declare function useObservable<T>(sub: Subscribable<T> | T, deps?: React.DependencyList): [T, (value: T) => void];
/**
 * Use this to easily wait for a promise in a functional component.
 * @param p The promise to wait for
 * @param initialValue the initial value to return before the promise resolves
 * @param deps the dependencies to pass to useEffect which will trigger a re-render when any of the dependencies change
 * @returns the initial value and the resolved value of the promise
 */
export declare function usePromise<T>(p: Promise<T> | (() => Promise<T>), initialValue?: T, deps?: React.DependencyList): T | undefined;
/**
 * Use this to create an observable in a functional component.
 * This automatically subscribes to the observable and triggers a re-render when the value changes.
 * @param initialValue This will be the initial value of the observable
 * @param doNotSubscribe If true, the observable will not be subscribed to automatically.
 * This is useful if you want to create an observable that persists between rerenders but doesn't cause rerenders itself.
 * @returns
 */
export declare function useObservableState<T>(initialValue?: T, doNotSubscribe?: boolean): import("knockout").Observable<T>;
/**
 * Same as useObservableState but for observable arrays
 */
export declare function useObservableArrayState<T = any>(initialValue?: T[], doNotSubscribe?: boolean): import("knockout").ObservableArray<T>;
/**
 * Use this to register a handler for a knockout subscribable in a functional component.
 * The handler will be called immediately and whenever the subscribable changes.
 * @param subscribable The observable to subscribe to
 * @param onChange The function to call with the new value when the observable changes
  */
export declare function useSubscription<T>(subscribable: Subscribable<T>, onChange: (value: T) => any, doNotCallOnChangeDuringSetup?: boolean): void;
export declare function useOnScreen(ref: React.RefObject<any>): boolean;
/**
 * This creates an observable that will automatically persist its value between page reloads using localStorage.
 * If localStorage is not available, the observable will not persist its value.
 * @param initialValue the initial value of the observable
 * @param globalName the name to use when storing the value in localStorage
 * @returns the observable that will persist between page reloads
 */
export declare function persistentValue<T>(initialValue: T, globalName: string): ko.Observable<T | undefined>;
