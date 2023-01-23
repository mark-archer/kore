import { isSubscribable, MaybeObservable, observableArray, ObservableArray, unwrap } from 'knockout';
import React, { useState } from 'react';
import { useObservable, useObservableState } from './kore-hooks';
import { Collection, IField } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { Datagrid, IDatagridColumn } from './datagrid';
import { camelCaseToSpaces } from '../utils';

interface IParams<T> {
  collection?: Collection<T>,
  data?: IDoc<T>[] | ObservableArray<IDoc<T>>
  columns?: IDatagridColumn<T>[]
  primaryKey?: IField
  editable?: boolean
  newRow?: (() => any) | boolean
  showSave?: boolean
  showDelete?: boolean
  onGoto?: (doc: IDoc<T>) => any
  onSave?: (doc: IDoc<T>) => any
  onDelete?: (doc: IDoc<T>) => any
  defaultSort?: string
  searchText?: MaybeObservable<string>
}

export const AutoColumnsExcludedNames: string[] = []


export function Autogrid<T>(params: IParams<T>) {
  params = { ...params };
  let { primaryKey, newRow } = params;

  // resolve `data`.  
  if (!params.data && params.collection) {
    const [_obsData] = useState(() => params.collection.observables.list());
    params.data = _obsData;
  }
  if (!params.data) {
    throw new Error('data or collection must be passed in');
  }

  // convert data: Observable<T> to data: T[]
  let obsData: ObservableArray<IDoc<T>>;
  if (isSubscribable(params.data)) {
    obsData = params.data;
  } else {
    obsData = observableArray(params.data);
  }

  // automatically determine collection 
  const collection: Collection<T> = params.collection || unwrap(params.data!)?.[0]?.collection!;

  // automatic newRow function
  const newRowCount = useObservableState(0);
  let _newRow: () => any;
  if (newRow === true || (newRow === undefined && params.editable)) {
    // TODO if collection is missing this will fail
    newRow = () => collection.init();
  }
  if (typeof newRow === 'function' ) {
    _newRow = () => {
      const newDataRow = (newRow as Function)();
      obsData.push(newDataRow);
      newRowCount(newRowCount()+1);
    }
  }

  let columns: IDatagridColumn<T>[] = params.columns || collection?.fields;
  if (!columns) {
    return <p>Loading... <small><br />(or no data and no columns)</small></p>;
  }

  if (!primaryKey) {
    primaryKey = collection.primaryKey;
  }

  if (!primaryKey) {
    throw new Error('primary key was not provide and cannot be inferred');
  }

  let autoColumns = false;
  if (columns === collection?.fields) {
    autoColumns = true;
  }
  columns = [...columns];
  if (autoColumns) {
    columns = columns.filter(c => !AutoColumnsExcludedNames.includes(c.name));
  }
  // replace `*Id` with `*` for fk columns
  columns.forEach(c => {
    if (c.fkCollection && !c.displayName) {
      let displayName = c.name;
      if (displayName.endsWith('Id')) {
        displayName = displayName.substring(0, c.name.length - 2).trim();
        c.displayName = camelCaseToSpaces(displayName);
      }
    }
  });

  if (params.editable === true || params.editable === false) {
    columns.forEach(c => {
      if (AutoColumnsExcludedNames.map(s => s.toLowerCase()).includes(c.name.toLowerCase())) {
        return;
      }
      if (c.editable !== true && c.editable !== false) {
        c.editable = params.editable;
      }
    })
  }

  const sortOrderColumn = columns.find(c => c.name === 'sortOrder');
  if (sortOrderColumn) {
    if (!sortOrderColumn.width) {
      sortOrderColumn.width = '80px';
    }
    if (!sortOrderColumn.displayName) {
      sortOrderColumn.displayName = 'Sort';
    }
  }

  if (params.onGoto) {
    if (typeof params.onGoto === 'function') {
      columns.unshift({
        displayName: ' ',
        name: 'goto',
        width: '10px',
        getContent: (doc, ref) => {
          useObservable(doc.q);
          if (doc.isNew) return <span></span>;
          return (
            <button ref={ref} className='btn btn-primary' onClick={evt => {
              params.onGoto(doc);
            }}>
              <i className="bi bi-box-arrow-up-right"></i>
            </button>
          )
        }
      });
    }
  }

  if ((params.showSave || params.onSave) || (params.editable && params.showSave !== false)) {
    const onSave = (doc: IDoc<T>) => {
      if (params.onSave) return params.onSave(doc);
      doc.save()
        .catch(err => {
          console.error(err);
        });
    }
    columns.push({
      displayName: ' ',
      name: 'Save',
      width: '10px',
      getContent: (doc: IDoc<T>, ref) => {
        useObservable(doc.q);
        if (doc.q() === 0) {
          return (
            <button ref={ref} className='btn btn-outline-secondary' disabled>
              Save
            </button>
          )
        } else {
          return (
            <button ref={ref} className='btn btn-primary' onClick={evt => onSave(doc)}>
              Save
            </button>
          )
        }
      }
    });
  }

  const [_data, setData] = useObservable(obsData);  
  
  if (params.showDelete !== false && (params.onDelete || params.editable)) {
    const onDelete = (doc: IDoc<T>) => {
      if (params.onDelete) return params.onDelete(doc);
      if (doc.isNew || confirm(`Are you sure you want to delete ${doc.displayValue()}?`)) {
        doc.delete();
        setData(_data.filter(d => d !== doc))
      }
    }
    columns.push({
      displayName: ' ',
      name: 'Delete',
      width: '10px',
      tdStyle: { textAlign: 'center', verticalAlign: 'middle' },
      getContent: (doc: IDoc<T>, ref) => {
        return (
          <button ref={ref} className='btn btn-danger btn-sm' onClick={() => onDelete(doc)}>
            {/* <i className="bi bi-x-circle"></i> */}
            <i className="bi bi-trash"></i>
          </button>
        )
      }
    });
  }

  // filter out any data that doesn't match search text
  const [searchText] = useObservable(params.searchText);
  const data = _data.filter((d: any) => {
    let _searchText = searchText.toLowerCase();
    // this matches fk fields (and other special fields) with custom values
    const match = columns.some(column => {
      const text = JSON.stringify(column?.getValue?.(d, null))
      return text?.toLowerCase().includes(_searchText);
    });
    if (match) {
      return match;
    }    
    return JSON.stringify(d?.toJS?.() || d).toLowerCase().includes(_searchText);    
  });

  const datagridParams = {
    defaultSort: 'id',
    ...params,
    columns,
    primaryKey,
    data,
    newRow: _newRow,
  }

  return (
    <Datagrid {...datagridParams} />
  )

}