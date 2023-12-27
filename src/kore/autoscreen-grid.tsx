import { observable, ObservableArray, Subscribable } from 'knockout';
import React, { useState } from 'react';
import { camelCaseToHyphens, camelCaseToSpaces } from '../utils';
import { Input } from './input';
import { Collection } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { Autogrid } from './autogrid';
import { IDatagridField } from './datagrid';
import { useObservable, useSubscription } from './hooks';

interface IProps<T> {
  collection: Collection<T>
  columns?: IDatagridField<T>[]
  onGoto?: boolean | ((doc: IDoc<T>) => any)
  data?: ObservableArray<IDoc<T>>
  defaultSort?: string
  changesExist?: Subscribable<boolean>
  filters?: (string[] | JSX.Element[])
  newRow?: boolean | (() => IDoc<T>)
  readOnly?: boolean
  title?: string
  hideSearch?: boolean
  showDelete?: boolean
  onSave?: (doc: IDoc<T>) => any
  onDelete?: (doc: IDoc<T>) => any
  hideTitle?: boolean
}

export let DefaultGoTo = (path: string) => {
  throw new Error('You must set `DefaultGoTo` or pass one in via props');
} 

export function AutoscreenGrid<T>(props: IProps<T>) {
  const changesExist = props.changesExist || useState(() => observable(false))[0];
  const { collection } = props;
  const [data] = useState(() => props.data || collection.observables.list());
  const [error, setError] = useState('');
  const [deletedDocs, setDeletedDocs] = useState<IDoc<T>[]>([]);
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
      const _data = data().filter(d => d.hasChanges());
      // todo try to make this a batch operation (i.e. if any fail, they all fail)
      if (props.onDelete) {
        await Promise.all(deletedDocs.map(d => props.onDelete(d)));
      } else {
        await Promise.all(deletedDocs.map(d => d.delete()));
      }
      if (props.onSave) {
        await Promise.all(_data.map(d => props.onSave(d)))
      } else {
        _data.forEach(d => d.validate());
        await Promise.all(_data.map(d => d.save()));
      }
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

  const showDelete = typeof props.showDelete === 'boolean' ? props.showDelete : props.readOnly !== true;

  return (
    <div className='container-fluid'>
      <span className='float-end'>
        {!props.readOnly && <SaveButton changesExist={changesExist} saveChanges={saveChanges} />}
        {error && (
          <span className='clearfix text-danger text-wrap' style={{ width: '100px' }}>
            <br />
            {error}
          </span>
        )}
      </span>

      { !props.hideTitle && (
        <h2 className='text-center'>
          {props.title || camelCaseToSpaces(collection.entity.namePlural)}
        </h2>
      )}

      { filterControls.length && (
        <div className="row" style={{ paddingBottom: '8px' }}>
          {filterControls.map((c, i) => <React.Fragment key={i}>{c}</React.Fragment>)}
        </div>
      )}

      <Autogrid
        collection={collection}
        columns={props.columns}
        data={data}
        defaultSort={props.defaultSort ?? 'id'}
        readOnly={props.readOnly}
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