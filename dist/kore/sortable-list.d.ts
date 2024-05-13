import React from 'react';
import { MaybeSubscribable } from 'knockout';
export interface ISortable {
    sortOrder: number;
}
interface ISortableListProps<T extends ISortable> {
    items: MaybeSubscribable<T[]>;
    renderItem: (props: {
        item: T;
        listId: string;
        sortHandle: string;
    }) => React.ReactNode;
    listsGroup?: string;
    onAdd?: ((itemId: string, sortOrder: number) => any);
    onUpdate?: ((args: {
        items: T[];
        ixMoved: number[];
    }) => any);
    hidden?: boolean;
    containerProps?: Record<string, any>;
    dragHandleClassName?: string;
    sortDirection?: 'asc' | 'desc';
    minHeight?: string | number;
    paddingBottom?: string | number;
}
export declare class SortableList<T extends ISortable> extends React.Component<ISortableListProps<T>, {}> {
    constructor(props: any);
    self: any;
    items: any[];
    listId: string;
    sortHandle: string;
    calculateSortOrder(index: any): number;
    componentDidMount(): void;
    render(): JSX.Element;
}
export {};
