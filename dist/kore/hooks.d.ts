/// <reference types="react" />
import { Subscribable } from 'knockout';
export declare function useObservable<T>(sub: Subscribable<T> | T, deps?: React.DependencyList): [T, (value: T) => void];
export declare function usePromise<T>(p: Promise<T> | (() => Promise<T>), initialValue?: T, deps?: React.DependencyList): T;
export declare function useObservableState<T>(initialValue?: T): import("knockout").Observable<T>;
export declare function useObservableArrayState<T = any>(initialValue?: T[]): import("knockout").ObservableArray<T>;
export declare function useSubscription<T>(subscribable: Subscribable<T>, onChange: (value: T) => any): void;
export declare function useOnScreen(ref: any): boolean;
export declare function persistentValue<T>(initialValue: T, globalName: string): ko.Observable<T>;
