/// <reference types="react" />
import { ObservableArray, Subscribable } from 'knockout';
import { Collection } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { IDatagridField } from './datagrid';
interface IProps<T> {
    collection: Collection<T>;
    columns?: IDatagridField<T>[];
    onGoto?: boolean | ((doc: IDoc<T>) => any);
    data?: ObservableArray<IDoc<T>>;
    defaultSort?: string;
    changesExist?: Subscribable<boolean>;
    filters?: (string[] | JSX.Element[]);
    newRow?: boolean | (() => IDoc<T>);
    readOnly?: boolean;
    title?: string;
    hideSearch?: boolean;
    showDelete?: boolean;
    onSave?: (doc: IDoc<T>) => any;
    onDelete?: (doc: IDoc<T>) => any;
}
export declare let DefaultGoTo: (path: string) => never;
export declare function AutoscreenGrid<T>(props: IProps<T>): JSX.Element;
export {};
