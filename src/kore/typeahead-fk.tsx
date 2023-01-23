import React, { useEffect, useState } from 'react'
import { Collection } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { Typeahead } from './typeahead';
import { observable, Observable, ObservableArray } from 'knockout';
import { useObservable } from './kore-hooks';
import { camelCaseToSpaces } from '../utils';
import { IDatagridColumn } from './datagrid';

interface IProps {
  fkCollection: Collection<any>
  fkId: Observable<string>
  options?: ObservableArray<IDoc<any>>
  readonly?: boolean
  innerRef?: any
  placeholder?: string
  source?: (text) => Promise<any[]>
  dontLoadEmptyString?: boolean
  dataGridColumn?: IDatagridColumn<any>
}

const supportTableEntries: { [key: string]: ObservableArray<IDoc<any>> } = {};
const supportTables = []; //[GLAccountTypes, GLBalanceTypes];

const fkColumnValueCache = {} as Record<string, string>;

export function TypeaheadFK(props: IProps) {
  const { fkCollection } = props;
  const [fkId, setFkId] = useObservable(props.fkId);
  const [docObs] = useState(() => observable<IDoc<any>>());
  const [doc, setDoc] = useObservable(docObs);
  useObservable(props.options);

  let source = props.source || fkCollection.search;
    // if we're going to use the default search, limit to first 1000 results to prevent performance problems for large datasets
    // ((text) => fkCollection.search(text, 1000)); // doing this prevents smart results caching in `typeahead` so this needs to be one fn per collection

  let options = props.options;
  if (!options && supportTables.map(t => t.name).includes(fkCollection.entityName)) {
    if (!supportTableEntries[fkCollection.entityName]) {
      supportTableEntries[fkCollection.entityName] = fkCollection.observables.list();
    }
    options = supportTableEntries[fkCollection.entityName];
    source = undefined;
  }

  // look up doc with fkId
  useEffect(() => {
    if (doc?.id === fkId) return;
    if (options) {
      const opt = options().find(o => o.primaryKey() === fkId);
      setDoc(opt);
      return;
    }
    // get all values from db for these supportTables
    if (supportTables.map(t => t.name).includes(fkCollection.entityName)) {

      // get doc from list of support table entries, if support table entries are loaded, wait for load
      const _doc = supportTableEntries[fkCollection.entityName]().find(i => i.primaryKey() === fkId)
      if (_doc) {
        setDoc(_doc)
      } else {
        let sub = supportTableEntries[fkCollection.entityName].subscribe(() => {
          sub.dispose();
          const _doc = supportTableEntries[fkCollection.entityName]().find(i => i.primaryKey() === fkId)
          setDoc(_doc);
        });
      }
    } else {
      fkCollection.get(fkId).then(doc => setDoc(doc));
    }
  }, [fkId, options?.()])

  const displayField = (doc: IDoc<any>) => {
    const displayValue = doc?.displayValue?.();
    if (props.dataGridColumn?.name) {
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

  if (props.readonly) {
    return (<span>{displayField(doc)}</span>);
  }

  return (
    <Typeahead
      innerRef={props.innerRef}
      value={docObs}
      source={source}
      options={options}
      displayField={displayField}
      minLength={0}
      placeholder={props.placeholder || camelCaseToSpaces(fkCollection.entity.name)}
      afterChange={value => {
        if (value?.id !== fkId) {
          setDoc(value);
          setFkId(value?.id);
        }
      }}
      dontLoadEmptyString={props.dontLoadEmptyString}
      // filterBy={filterBy}
    />
  )
}
