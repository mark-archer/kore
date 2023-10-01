import React from 'react';
interface IProps<T> {
    loadMore: (existingItems: T[]) => Promise<T[]>;
    renderItems: (items: T[]) => React.ReactNode;
    filterItems?: (existingItems: T[]) => T[];
    endOfList?: React.ReactNode;
    loadingIndicator?: React.ReactNode;
    scrollThreshold?: number | string;
}
export declare function LazyList<T>(props: IProps<T>): JSX.Element;
export {};
