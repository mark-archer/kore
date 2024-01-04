import { Computed, Observable, ObservableArray } from 'knockout';
import { Collection } from './collection';
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
    get observableResults(): ObservableArray<IDoc<T>>;
    getResults(): Promise<IDoc<T>[]>;
}
export declare function dataQueryToSqlQuery(dataQuery: DataQuery<any>): string;
type SortBy<T> = (keyof T | `-${keyof T}`)[];
type DataFieldScalar = boolean | number | string | Date | null;
type DataFilterValueOperator = '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$exists';
type DataFilterValue = DataFieldScalar | DataFieldScalar[] | {
    [key in DataFilterValueOperator]?: DataFieldScalar;
} | {
    $nin: DataFieldScalar[];
};
type DataFilterAnd<T> = {
    [key in keyof T]?: DataFilterValue;
};
type DataFilterOr<T> = DataFilterAnd<T>[];
export type DataFilter<T> = DataFilterAnd<T> | DataFilterOr<T>;
export declare function dataFilterToSqlWhere(filter: DataFilter<any>): string;
export declare function dataFilterToSqlTextSearch(query: DataQuery<any>): string;
export {};
