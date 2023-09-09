import React from 'react'
import { useObservable } from './hooks';
import Select from 'react-select'
import AsyncSelect from 'react-select/async';
import _ from 'lodash';
import { MaybeObservable } from 'knockout';

interface IProps<T> {
  source?: (query: string) => Promise<T[]>
  options?: MaybeObservable<T[]>
  value?: MaybeObservable<T>
  displayField?: string | ((x: T) => string)
  minLength?: number
  afterChange?: (value: T) => any
  placeholder?: string
  innerRef?: any
  dontLoadEmptyString?: boolean
  dontSortSourceResults?: boolean  
}

const optionsCache = new Map<any, Promise<any[]>>();

export function Typeahead<T>(props: IProps<T>) {

  const [value, setValue] = useObservable(props.value);
  const [options] = useObservable(props.options);

  let { displayField } = props;

  if (!displayField) {
    displayField = 'display';
  }
  let getLabel: (x: T) => string;
  if (typeof displayField === 'function') {
    getLabel = displayField;
  } else {
    getLabel = (x: T) => x[displayField as string];
  }

  const promiseOptions = (query: string) => {
    const sortFields = ['sortOrder', 'name', 'id', 'Id'];
    if (!query) {
      let cache = optionsCache.get(props.source);
      if (!cache) {
        cache = props.source(query).then(results => {
          if (props.dontSortSourceResults) {
            return results;
          }
          return _.sortBy(results, ...sortFields);
        });
        optionsCache.set(props.source, cache)
      }
      return cache;
    }
    return props.source?.(query).then(results => {
      if (props.dontSortSourceResults) {
        return results;
      }
      return _.sortBy(results, ...sortFields);
    });
  }

  function getOptionValue(x: T) {
    // @ts-ignore
    return x.id || x.Id || x._id;
  }

  function onChange(selection: T[]) {
    if (selection.length <= 1) {
      setValue(selection[0])
    } else {
      throw new Error('multi-select not currently supported')
    }
    if (props.afterChange) {
      props.afterChange(selection[0])
    }
  }


  if (options) {
    return (
      <Select
        ref={props.innerRef}
        value={value}
        options={options}
        getOptionLabel={getLabel}
        getOptionValue={getOptionValue}
        isClearable
        onChange={evt => onChange([evt])}
        placeholder={props.placeholder}
      />
    )
  }

  return (
    <AsyncSelect
      ref={props.innerRef}
      cacheOptions
      defaultOptions={!props.dontLoadEmptyString}
      value={value}
      loadOptions={promiseOptions}
      getOptionLabel={getLabel}
      getOptionValue={getOptionValue}
      isClearable
      onChange={evt => onChange([evt])}
      placeholder={props.placeholder}
    />
  );
}