import { Computed, Observable, ObservableArray } from 'knockout';
import { Collection, ICursorIterable } from './collection';
import { IDoc } from './doc';
export declare class DataQuery<T> {
    readonly collection: Collection<T>;
    readonly execQuery: (query: DataQuery<T>) => Promise<T[]>;
    readonly page: Observable<number>;
    readonly pageSize: Observable<number>;
    readonly sortBy: Observable<SortBy<T>>;
    readonly filter: Observable<DataFilter<T>>;
    readonly clientFilter: Observable<(entity: T) => boolean>;
    readonly changes: Computed<number>;
    readonly textSearch: Observable<string>;
    constructor(collection: Collection<T>, execQuery: (query: DataQuery<T>) => Promise<T[]>, filter?: DataFilter<T>);
    clone(): DataQuery<T>;
    getResults(): Promise<IDoc<T>[]>;
    get observablePage(): ObservableArray<IDoc<T>>;
    cursor(): ICursorIterable<T>;
}
type StringKeyOf<T> = Extract<keyof T, string>;
export type SortBy<T> = (StringKeyOf<T> | `-${StringKeyOf<T>}`)[];
export type DataFieldScalar = boolean | number | string | Date | null;
export type DataFilterValueOperator = '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$exists';
export type DataFilterValue = DataFieldScalar | DataFieldScalar[] | {
    [key in DataFilterValueOperator]?: DataFieldScalar;
} | {
    $nin: DataFieldScalar[];
};
export type DataFilterAnd<T> = {
    [key in keyof T]?: DataFilterValue;
};
export type DataFilterOr<T> = DataFilterAnd<T>[];
export type DataFilter<T> = DataFilterAnd<T> | DataFilterOr<T>;
export declare function dataQueryToSqlQuery(dataQuery: DataQuery<any>): string;
export declare function dataFilterToSqlWhere(filter: DataFilter<any>): string;
export declare function dataFilterToSqlTextSearch(query: DataQuery<any>): string;
export {};
