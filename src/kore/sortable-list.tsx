import React from 'react';
import { MaybeSubscribable, unwrap } from 'knockout';
import Sortable from 'sortablejs';
import { last, sortBy } from 'lodash';

console.log('sortable-list');

export interface ISortable {
  sortOrder: number
}

interface ISortableListProps<T extends ISortable> {
  items: MaybeSubscribable<T[]>,
  renderItem: (props: { item: T, taskListId: string, sortHandle: string }) => React.ReactNode,
  listsGroup?: string
  onAdd?: ((itemId: string, sortOrder: number) => any),
  onUpdate?: ((args: { items: T[], ixMoved: number[] }) => any),
  hidden?: boolean,
  containerProps?: Record<string, any>
  dragHandleClassName?: string
  sortDirection?: 'asc' | 'desc'
}

export class SortableList<T extends ISortable> extends React.Component<ISortableListProps<T>, {}>
{

  constructor(props) {
    super(props);
    this.sortHandle = this.props.dragHandleClassName && `.${this.props.dragHandleClassName}` || this.sortHandle;
  }

  self: any

  items: any[]

  listId = `${Date.now()}_${Math.round(Math.random()*100000)}`;
  sortHandle = `.sort-handle-${this.listId}`;

  calculateSortOrder(index) {
    const items = this.items;
    if (index === 0) return Date.now();
    if (index >= items.length) return last(items).sortOrder - 10000;
    const above = items[index - 1].sortOrder ?? Date.now();
    const below = items[index].sortOrder ?? Number.MIN_VALUE;
    if (above === below) alert('sort order has converged to the same number in this area.  Try moving items to the top or bottom of the list to fix it')
    return above - ((above - below) / 2)
  }

  componentDidMount() {
    const self = this;
    const listDiv = document.getElementById(this.listId);

    Sortable.create(listDiv, {
      handle: this.sortHandle,
      group: { name: this.props.listsGroup || this.listId, put: !!this.props.onAdd },
      animation: 100,

      onUpdate: evt => {
        console.log(evt)
        const items = self.items;
        const item = items.splice(evt.oldIndex, 1)[0];
        item.sortOrder = this.calculateSortOrder(evt.newIndex);
        items.splice(evt.newIndex, 0, item);
        // console.log(items.map(i => i.toJS()));
        if (this.props.onUpdate) {
          this.props.onUpdate({ items, ixMoved: [evt.newIndex] })
        }
      },

      onAdd: evt => {
        const taskEl = evt.item;  // dragged HTMLElement
        if (evt.to !== evt.from) {
          // first restore html hierarchy so html doesn't get out of sync with react
          evt.to.removeChild(taskEl);
          evt.from.appendChild(taskEl);

          // now if we were given an `onAdd` function, call it
          if (this.props.onAdd) {
            const itemId = evt.item.id;
            this.props.onAdd(itemId, this.calculateSortOrder(evt.newIndex));
          }
        }
      },
    });
  }

  public render() {
    let items = unwrap(this.props.items);
    if (this.props.sortDirection === 'asc') {
      items = sortBy(items, i => i.sortOrder ?? -Infinity);
    } else {
      items = sortBy(items, i => -i.sortOrder ?? Infinity);
    }
    this.items = items;
    return (
      <div id={this.listId} style={{ minHeight: "25px" }} {...this.props.containerProps} >
        {items.map(item => this.props.renderItem({ item, taskListId: this.listId, sortHandle: this.sortHandle.substring(1) }))}
      </div>
    )
  }
}