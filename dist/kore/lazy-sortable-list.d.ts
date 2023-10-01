import React from 'react';
import { ISortable } from './sortable-list';
interface IProps<T> {
    loadMore: (existingItems: T[]) => Promise<T[]>;
    filterItems?: (existingItems: T[]) => T[];
    renderItem: (props: {
        item: T;
        taskListId: string;
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
    endOfList?: React.ReactNode;
    loadingIndicator?: React.ReactNode;
    scrollThreshold?: string | number;
}
export declare function LazySortableList<T extends ISortable>(props: IProps<T>): JSX.Element;
export {};
