import { observable, ObservableArray, Subscribable } from 'knockout';
import React, { useState } from 'react';
import { camelCaseToHyphens, camelCaseToSpaces } from '../utils';
import { Input } from './input';
import { Collection } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { Autogrid } from './autogrid';
import { IDatagridColumn } from './datagrid';
import { useObservable, useSubscription } from './kore-hooks';

interface IProps {
  collection: Collection<any>
  columns?: IDatagridColumn<any>[]
  onGoto?: boolean | ((doc: IDoc<any>) => any)
  data?: ObservableArray<IDoc<any>>
  defaultSort?: string
  changesExist?: Subscribable<boolean>
  filters?: (string[] | JSX.Element[])
  newRow?: boolean | (() => IDoc<any>)
  editable?: boolean
  title?: string
  hideSearch?: boolean
  showDelete?: boolean
}

export let DefaultGoTo = (path: string) => {
  throw new Error('You must set `DefaultGoTo` or pass one in via props');
} 

export const AutoscreenGrid = (props: IProps) => {
  const changesExist = props.changesExist || useState(() => observable(false))[0];
  const { collection } = props;
  const [data] = useState(() => props.data || collection.observables.list());
  const [error, setError] = useState('');
  const [deletedDocs, setDeletedDocs] = useState<IDoc<any>[]>([]);
  const [searchText] = useState(() => observable(''))
  
  useSubscription(data, (_data) => {
    const onChange = () => {
      changesExist(true);
    }
    const sub = data.subscribe(() => {
      if (data().some(d => d.isNew)) {
        changesExist(true);
      }
    });
    const subs = data().map(d => d.q.subscribe(onChange));
    return () => {
      sub.dispose();
      subs.forEach(s => s.dispose());
    }
  });

  async function saveChanges() {
    try {
      const _data = data();
      _data.forEach(d => d.validate());
      await Promise.all(deletedDocs.map(d => d.delete()));
      await Promise.all(_data.filter(d => d.q() > 0 || d.isNew).map(d => d.save()));
      setError('');
      changesExist(false);
    } catch (err) {
      setError(String(err));
    }
  }

  const pluralNamePath = camelCaseToHyphens(collection.entity.namePlural);

  let onGoto: any = props.onGoto;
  if (onGoto !== false && typeof onGoto !== 'function') {
    onGoto = doc => {
      DefaultGoTo(`${pluralNamePath}/${doc[collection.primaryKey.name]}`);
    };
  }

  let filterControls = props.filters || [];
  if (filterControls.some(s => typeof s === 'string')) {
    throw new Error('filter controls specified by strings is not yet supported')
  }

  filterControls = filterControls.map(fc => {
    return (
      <div className="col-3">
        {fc}
      </div>
    );
  });
  
  if (!props.hideSearch) {
    let offsetCnt = 9 - ((filterControls.length) * 3);
    filterControls.push(
      <div className={`col-3 offset-${offsetCnt}`}>
        <Input className='form-control' value={searchText} placeholder="search grid..." />
      </div>
    )
  }

  const showDelete = typeof props.showDelete === 'boolean' ? props.showDelete : props.editable !== false;

  return (
    <div className='container-fluid'>
      <span className='float-end'>
        {props.editable !== false && <SaveButton changesExist={changesExist} saveChanges={saveChanges} />}
        {error && (
          <span className='clearfix text-danger text-wrap' style={{ width: '100px' }}>
            <br />
            {error}
          </span>
        )}
      </span>

      <div className='fs-2 text-center'>
        {props.title || camelCaseToSpaces(collection.entity.namePlural)}
      </div>

      { filterControls.length && (
        <div className="row" style={{ paddingBottom: '8px' }}>
          {filterControls}
        </div>
      )}

      <Autogrid
        collection={collection}
        columns={props.columns}
        data={data}
        defaultSort={props.defaultSort ?? 'id'}
        editable={props.editable !== false}
        showSave={false}
        showDelete={showDelete}
        onDelete={doc => {
          changesExist(true);
          data.remove(doc);
          setDeletedDocs([...deletedDocs, doc]);
        }}
        onGoto={onGoto}
        newRow={props.newRow}
        searchText={searchText}
      />

    </div>

  )
}

const SaveButton = (props: { changesExist: Subscribable<boolean>, saveChanges: (() => any), dontFloat?: boolean }) => {
  const { saveChanges, dontFloat } = props
  const [changesExist] = useObservable(props.changesExist);
  let style = {};
  if (!dontFloat && changesExist) {
    style = { position: 'absolute', right: '25px' };
  }
  return (
    <span
      style={{
        ...style
      }}
    >
      {!changesExist && (
        <button className='btn btn-outline-secondary' disabled>Save Changes</button>
      )}
      {changesExist && (
        <button className='btn btn-primary' onClick={saveChanges}>Save Changes</button>
      )}
    </span>
  )
}