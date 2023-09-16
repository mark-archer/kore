import { Observable } from 'knockout';
import { Collection } from './collection';
export type IDoc<T> = {
    load: (objOrId?: any) => Promise<IDoc<T>>;
    save: () => Promise<IDoc<T>>;
    delete: () => Promise<void>;
    toJS: () => T;
    validate: () => T;
    validationError: Observable<any>;
    collection: Collection<T>;
    qs: {
        [K in keyof T]-?: Observable<T[K]>;
    };
    q: Observable<number>;
    displayValue: (() => string);
    primaryKey: (() => string | number);
    isNew: boolean;
    hasChanges: () => boolean;
} & {
    [key in keyof T]: T[key];
};
export declare function newDoc<T>(data?: {}, collection?: Collection<T>): IDoc<T>;
