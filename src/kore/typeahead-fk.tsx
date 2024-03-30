import React, { useEffect, useState } from 'react'
import { Collection } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { Typeahead } from './typeahead';
import { observable, Observable, ObservableArray } from 'knockout';
import { useObservable } from './hooks';
import { camelCaseToSpaces } from '../utils';
import { IDatagridField } from './datagrid';

interface IProps<T>{
  fkCollection: Collection<T>
  fkId: Observable<string>
  options?: ObservableArray<IDoc<T>>
  readOnly?: boolean
  innerRef?: any
  placeholder?: string
  source?: (text) => Promise<IDoc<T>[]>
  dontLoadEmptyString?: boolean
  dataGridColumn?: IDatagridField<T>
  afterChange?: (value: T) => any  
}

const supportTableEntries: { [key: string]: ObservableArray<IDoc<any>> } = {};
export const supportTables = [] as Collection<any>[]; //[GLAccountTypes, GLBalanceTypes];

const fkColumnValueCache = {} as Record<string, string>;

const fkValueCache = {} as Record<string, Promise<any>>;
export const fkValueCacheTTL = 1000;

function getFkValue<T>(fkCollection: Collection<T>, fkId: any): Promise<T> {
  const cacheId = `${fkCollection.entityName}-${fkId}`;
  let pValue = fkValueCache[cacheId];
  if (!pValue) {
    pValue = fkCollection.get(fkId);
    fkValueCache[cacheId] = pValue;
    setTimeout(() => delete fkValueCache[cacheId], fkValueCacheTTL);
  }
  return pValue;
}

export function TypeaheadFK<T>(props: IProps<T>) {
  const { fkCollection } = props;
  const [fkId, setFkId] = useObservable(props.fkId);
  const [docObs] = useState(() => observable<IDoc<T>>());
  const [doc, setDoc] = useObservable(docObs);
  
  let source = props.source || fkCollection.search;

  let options = props.options;
  const supportTable = supportTables.find(st => st.entityName === fkCollection.entityName);
  if (!options && supportTable) {
    if (!supportTableEntries[fkCollection.entityName]) {
      supportTableEntries[fkCollection.entityName] = fkCollection.observables.list();
    }
    options = supportTableEntries[fkCollection.entityName] as any;
    source = undefined;
  }

  useObservable(options);

  // look up doc with fkId
  useEffect(() => {
    if (doc?.primaryKey() === fkId) return;
    if (options) {
      // get doc from list of support table entries, if support table entries are loaded, wait for load
      const _doc = options().find(i => i.primaryKey() === fkId) as (IDoc<T> | null)
      setDoc(_doc);
    } else {
      getFkValue(fkCollection, fkId).then(setDoc);
    }
  }, [
    fkId, 
    options?.()?.map(o => o.primaryKey()).join(',') || ''
  ]);

  const displayField = (doc: IDoc<any>) => {
    const displayValue = doc?.displayValue?.();
    if (doc && props.dataGridColumn?.name) {
      const value = displayValue;
      // const value = doc?.sortOrder ?? displayValue;
      fkColumnValueCache[`${props.dataGridColumn.name}-${doc.primaryKey()}`] = value;
    }
    return displayValue;
  }

  // allows sorting by value of typeahead 
  if (props.dataGridColumn && !props.dataGridColumn.getValue) {
    props.dataGridColumn.getValue = (doc, ref) => {
      const colName = props.dataGridColumn.name;
      const colValue = doc[colName]
      return fkColumnValueCache[`${colName}-${colValue}`];
    }
  }

  // show error if fkId not available in options
  if (fkId && !doc && options?.()?.length) {
    return (<span>selected value not available in options</span>);
  }

  // wait for doc to be retrieved before rendering the typeahead
  if (fkId && !doc) {
    return (<span>loading...</span>);
  }

  if (props.readOnly) {
    return (<span>{displayField(doc)}</span>);
  }

  return (
    <Typeahead<IDoc<T>>

      innerRef={props.innerRef}
      value={docObs}
      source={source}
      options={options}
      displayField={displayField}
      minLength={0}
      placeholder={props.placeholder || camelCaseToSpaces(fkCollection.entity.name)}
      afterChange={value => {
        if (value?.primaryKey() !== fkId) {
          setDoc(value);
          setFkId(value?.primaryKey() as string);
        }
        if (props.afterChange) {
          props.afterChange(value)
        }
      }}
      dontLoadEmptyString={props.dontLoadEmptyString}
      // filterBy={filterBy}
    />
  )
}
