import { DataFilter, DataQuery } from "./data-query";
import { IEntity } from "./collection";
export declare function rdfEntityToSqlColumns(entity: IEntity): string;
export declare function dataQueryToRdfQuery(entity: IEntity, dataQuery: DataQuery<any>): string;
export declare function dataFilterToSqlWhere(filter: DataFilter<any>): string;
export declare function dataFilterToSqlTextSearch(query: DataQuery<any>): string;
