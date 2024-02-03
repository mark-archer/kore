import { Observable, ObservableArray } from 'knockout';
import { IDoc } from './doc';
import { IObjectMatch } from '../utils';
import { DataFilter, DataQuery } from './data-query';
export interface IEntity {
    id?: string;
    name: string;
    namePlural?: string;
    fields: IField[];
    primaryKey?: IField;
    extends?: IEntity;
    displayValue?: string | ((doc: any) => string);
}
export type FieldType = 'id' | 'string' | 'boolean' | 'number' | 'Date' | 'any';
export interface IField {
    name: string;
    displayName?: string;
    dataType: FieldType;
    optional?: boolean;
    array?: boolean;
    defaultValue?: any;
    fkType?: IEntity;
    fkCollection?: Collection<any>;
    format?: 'money' | 'date' | 'datetime';
}
export type ICursorDirection = 'next' | 'nextunique' | 'prev' | 'prevunique';
export interface ICursor<T> {
    value: T;
    next: () => Promise<T | null>;
}
export type ICursorIterable<T> = ICursor<T> & AsyncIterable<T>;
export declare function iterableCursor<T>(cursor: ICursor<T>): ICursorIterable<T>;
export interface IDataSource<T> {
    get(id: string): Promise<T | null>;
    query(query: DataQuery<T>): Promise<T[]>;
    list(lastModified?: number, group?: string, direction?: ICursorDirection): Promise<ICursor<T>>;
    save(data: T): Promise<T>;
    remove(data: T): Promise<boolean>;
}
export declare const collections: Collection<any>[];
export declare class Collection<T> {
    readonly entity: IEntity;
    readonly validate: (data: T) => void;
    private dataSource;
    fields: IField[];
    entityName: string;
    readonly primaryKey: IField;
    constructor(entity: IEntity, validate: (data: T) => void, dataSource: IDataSource<T>, primaryKey?: IField);
    init(_data?: Partial<T>): IDoc<T>;
    get(id: string): Promise<IDoc<T> | null>;
    list(match?: IObjectMatch<T> | ((doc: T) => (boolean | Promise<boolean>)), limit?: number, lastModified?: number, group?: string, direction?: ICursorDirection): Promise<IDoc<T>[]>;
    search(text: string, limit?: number, lastModified?: number, group?: string, direction?: ICursorDirection): Promise<IDoc<T>[]>;
    query(filter?: DataFilter<T>): DataQuery<T>;
    save(_entity: T): Promise<T>;
    remove(entity: T | string): Promise<boolean>;
    observables: {
        get: (id: string) => Observable<IDoc<T>>;
        list: (match?: IObjectMatch<T> | ((doc: T) => (boolean | Promise<boolean>)), limit?: number, lastModified?: number, group?: string, direction?: ICursorDirection) => ObservableArray<IDoc<T>>;
        search: (text: string, limit?: number, lastModified?: number, group?: string, direction?: ICursorDirection) => ObservableArray<IDoc<T>>;
        query: (filter?: DataFilter<T>) => ObservableArray<IDoc<T>>;
    };
}
