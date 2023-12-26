/// <reference types="react" />
import { Collection } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { Observable, ObservableArray } from 'knockout';
import { IDatagridField } from './datagrid';
interface IProps<T> {
    fkCollection: Collection<T>;
    fkId: Observable<string>;
    options?: ObservableArray<IDoc<T>>;
    readOnly?: boolean;
    innerRef?: any;
    placeholder?: string;
    source?: (text: any) => Promise<IDoc<T>[]>;
    dontLoadEmptyString?: boolean;
    dataGridColumn?: IDatagridField<T>;
    afterChange?: (value: T) => any;
}
export declare const supportTables: Collection<any>[];
export declare const fkValueCacheTTL = 1000;
export declare function TypeaheadFK<T>(props: IProps<T>): JSX.Element;
export {};
