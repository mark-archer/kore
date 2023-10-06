import React from 'react';
import { LazyList } from './lazy-list';
import { ISortable, SortableList } from './sortable-list';

interface IProps<T> {
  loadMore: (existingItems: T[]) => Promise<T[]>
  filterItems?: (existingItems: T[]) => T[]
  renderItem: (props: { item: T, taskListId: string, sortHandle: string }) => React.ReactNode,
  listsGroup?: string
  onAdd?: ((itemId: string, sortOrder: number) => any),
  onUpdate?: ((args: { items: T[], ixMoved: number[] }) => any),
  hidden?: boolean,
  containerProps?: Record<string, any>
  dragHandleClassName?: string
  sortDirection?: 'asc' | 'desc'
  minHeight?: string | number
  paddingBottom?: string | number
  endOfList?: React.ReactNode
  loadingIndicator?: React.ReactNode
  scrollThreshold?: string | number
  lazyListStyle?: React.CSSProperties
}

export function LazySortableList<T extends ISortable>(props: IProps<T>) {

  return (
    <LazyList
      lazyListStyle={props.lazyListStyle}
      loadMore={props.loadMore}
      filterItems={props.filterItems}
      endOfList={props.endOfList}
      loadingIndicator={props.loadingIndicator}
      scrollThreshold={props.scrollThreshold}
      renderItems={items => (
        <SortableList
          items={items}
          sortDirection={props.sortDirection}
          renderItem={props.renderItem}
          listsGroup={props.listsGroup}
          onAdd={props.onAdd}
          onUpdate={props.onUpdate}
          hidden={props.hidden}
          containerProps={props.containerProps}
          dragHandleClassName={props.dragHandleClassName}
          minHeight={props.minHeight}
          paddingBottom={props.paddingBottom}
        />
      )}
    />
  )
}