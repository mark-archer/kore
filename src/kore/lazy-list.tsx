import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useObservable } from './hooks';
import { observable, observableArray } from 'knockout';

interface IProps<T> {
  loadMore: (existingItems: T[]) => Promise<T[]>
  renderItems: (items: T[]) => React.ReactNode
  filterItems?:(existingItems: T[]) => T[]
  endOfList?: React.ReactNode
  loadingIndicator?: React.ReactNode
  scrollThreshold?: number | string
  lazyListStyle?: React.CSSProperties
}

export function LazyList<T>(props: IProps<T>) {
  const [itemsObsAry] = useState(() => observableArray<T>([]));
  const [items] = useObservable(itemsObsAry);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loading] = useState(() => observable(false));
  useObservable(loading);

  async function loadMore() {
    if (loading()) {
      // console.log('loading called while prior load still in progress')
      return;
    }
    loading(true);
    const moreItems = await props.loadMore(items);
    if (!moreItems.length) {
      console.log('all items loaded');
      setAllLoaded(true);
    } else {
      itemsObsAry.push(...moreItems);
    }
    loading(false);
  }

  let renderItems = items;
  if (props.filterItems) {
    renderItems = props.filterItems(items);
  }
  
  if (renderItems.length < 50 && !allLoaded) {
    loadMore();
  }
  // console.log('existing tasks', items.length);
  // console.log('rendering tasks', renderItems.length);

  return (
    <div
      id="scrollableDiv"
      style={props.lazyListStyle}
      // style={{
      //   // height: '600px',
      //   overflow: 'auto',
      //   marginLeft: '10px',
      //   display: 'flex',
      //   // flexDirection: 'column-reverse',
      // }}
    >
      <InfiniteScroll
        dataLength={renderItems.length}
        next={loadMore}
        hasMore={!allLoaded}
        scrollThreshold={props.scrollThreshold}
        loader={
          props.loadingIndicator ??
          <>
            <div className="d-flex justify-content-center">
              <div>loading...</div>
            </div>
          </>
        }
        endMessage={
          props.endOfList ??
          <>
            <div className="d-flex justify-content-center">
              <i>end of list</i>
            </div>
          </>
        }
      >
        {props.renderItems(renderItems)}
      </InfiniteScroll>
    </div>
  )
}
