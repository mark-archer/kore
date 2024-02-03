/// <reference types="react" />
import { MaybeObservable, Observable, ObservableArray } from 'knockout';
import { Collection, IField } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { IDatagridField } from './datagrid';
interface IParams<T> {
    collection?: Collection<T>;
    data?: IDoc<T>[] | ObservableArray<IDoc<T>>;
    columns?: IDatagridField<T>[];
    primaryKey?: IField;
    readOnly?: boolean;
    newRow?: (() => any) | boolean;
    showSave?: boolean;
    showDelete?: boolean;
    onGoto?: (doc: IDoc<T>) => any;
    onSave?: (doc: IDoc<T>) => any;
    onDelete?: (doc: IDoc<T>) => any;
    defaultSort?: string;
    searchText?: MaybeObservable<string>;
    page?: Observable<number>;
    pageSize?: Observable<number>;
    cacheSortWithId?: string;
    selectedRow?: Observable<IDoc<T>>;
}
export declare const AutoColumnsExcludedNames: string[];
export declare function Autogrid<T>(params: IParams<T>): JSX.Element;
export {};
