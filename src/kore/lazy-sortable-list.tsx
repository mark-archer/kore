import React from 'react';
import { LazyList } from './lazy-list';
import { ISortable, SortableList } from './sortable-list';

interface IProps<T> {
  loadMore: (existingItems: T[]) => Promise<T[]>
  filterItems?:(existingItems: T[]) => T[]
  renderItem: (props: { item: T, taskListId: string, sortHandle: string }) => React.ReactNode,
  listsGroup?: string
  onAdd?: ((itemId: string, sortOrder: number) => any),
  onUpdate?: ((args: { items: T[], ixMoved: number[] }) => any),
  hidden?: boolean,
  containerProps?: Record<string, any>
  dragHandleClassName?: string
}

export function LazySortableList<T extends ISortable>(props: IProps<T>) {

  return (
    <LazyList
      loadMore={props.loadMore}
      filterItems={props.filterItems}
      renderItems={items => (
        <SortableList
          items={items}
          renderItem={props.renderItem}
          listsGroup={props.listsGroup}
          onAdd={props.onAdd}
          onUpdate={props.onUpdate}
          hidden={props.hidden}
          containerProps={props.containerProps}
          dragHandleClassName={props.dragHandleClassName}
        />
      )}
    />
  )
}