import { Observable } from 'knockout';
import React from 'react';
import { IField } from '../orm/collection';
import { IDoc } from '../orm/doc';
export interface IDatagridField<T> extends Partial<IField> {
    name: string;
    readOnly?: boolean;
    width?: any;
    disabled?: (doc: IDoc<T>) => boolean;
    getContent?: (doc: IDoc<T>, ref: React.MutableRefObject<undefined>) => any;
    getHeader?: () => any;
    getValue?: (doc: IDoc<T>, ref: React.MutableRefObject<undefined>) => any;
    tdStyle?: any;
    showTotal?: boolean | ((docs: IDoc<T>[]) => any);
}
export interface IParams<T> {
    data: IDoc<T>[];
    columns: IDatagridField<T>[];
    primaryKey: IField;
    newRow?: () => any | false;
    defaultSort?: string;
    disableSorting?: boolean;
    searchText?: string;
    page?: number;
    pageSize?: number;
    cacheSortWithId?: string;
}
export declare const sortCache: Observable<{
    [sortId: string]: string[];
}>;
export declare function Datagrid<T>(params: IParams<T>): JSX.Element;
