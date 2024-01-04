import { Computed, Observable, ObservableArray, computed, observable, observableArray } from 'knockout';
import { isArray } from 'lodash';
import { Collection } from './collection';
import { IDoc } from './doc';

export class DataQuery<T> {

  public readonly page: Observable<number> = observable(1);
  public readonly pageSize: Observable<number> = observable(30);
  public readonly sortBy: Observable<SortBy<T>> = observable([]);
  public readonly filter: Observable<DataFilter<T>> = observable({});
  public readonly clientFilter = observable<null | ((entity: T) => boolean)>(null);
  public readonly changes: Computed<number>;
  public readonly textSearch: Observable<string> = observable('');

  constructor(
    public readonly collection: Collection<T>, 
    public readonly execQuery: (query: DataQuery<T>) => Promise<T[]>,
    filter?: DataFilter<T>,
  ) {
    if (filter) {
      this.filter(filter);
    }
    let changeCount = 0;
    this.changes = computed(() => {
      this.page()
      this.pageSize()
      this.sortBy()
      this.filter()
      this.clientFilter();
      this.textSearch();
      return changeCount++;
    })
  }  

  public get observableResults() : ObservableArray<IDoc<T>> {
    const obs = observableArray<IDoc<T>>([]);
    this.changes.subscribe(() => this.getResults().then(results => obs(results)));
    return obs;
  }

  public async getResults(): Promise<IDoc<T>[]> {
    return await this.execQuery(this).then(results => {
      if (this.clientFilter) {
        results = results.filter(this.clientFilter);
      }
      return results.map(r => this.collection.init(r));
    });
  }
}

export function dataQueryToSqlQuery(dataQuery: DataQuery<any>): string {
  let orderBy = "1";
  if (dataQuery.sortBy().length) {
    const sortBys = dataQuery.sortBy().map(s => String(s));
    orderBy = sortBys.map(s => {
      if (s.startsWith('-')) {
        return `[${s.substr(1)}] DESC`;
      } else {
        return `[${s}] ASC`;
      }
    }).join(', ');
  }
  let where = dataFilterToSqlWhere(dataQuery.filter());
  if (dataQuery.textSearch()) {
    const textSearch = dataFilterToSqlTextSearch(dataQuery);
    if (where !== '(1=1)') {
      where = `(${where}) AND (${textSearch})`;
    } else {
      where = textSearch;
    }
  }
  let sql = `
    SELECT 
      * 
    FROM [${dataQuery.collection.entity?.namePlural || dataQuery.collection.entityName}]
    WHERE ${where || '1=1'}
    ORDER BY ${orderBy}
    OFFSET ${dataQuery.pageSize() * (dataQuery.page() - 1)} ROWS
    FETCH ${dataQuery.pageSize()} ROWS
  `
    .trim()
    .replace(/    /g, '');
  return sql;
}


function dataQueryToMongoQuery() {
  throw new Error('not implemented');
}

// @ts-ignore
type SortBy<T> = (keyof T | `-${keyof T}`)[];

type DataFieldScalar = boolean | number | string | Date | null;

// export type DataFilterListOperator = '$in' | '$nin';
type DataFilterValueOperator = '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$exists';

type DataFilterValue = 
  DataFieldScalar | 
  DataFieldScalar[] | 
  // DataFilterList | 
  { [key in DataFilterValueOperator]?: DataFieldScalar } | 
  { $nin: DataFieldScalar[] };

type DataFilterAnd<T> = { 
  [key in keyof T]?: DataFilterValue 
}

type DataFilterOr<T> = DataFilterAnd<T>[];

export type DataFilter<T> = DataFilterAnd<T> | DataFilterOr<T>;

export function dataFilterToSqlWhere(filter: DataFilter<any>): string {
  if (isArray(filter)) {
    const orStatement = filter.map(f => dataFilterToSqlWhere(f)).join(' OR ');
    return `(${orStatement})`
  }
  const fieldNames = Object.keys(filter).filter(name => !name.startsWith('$'));
  if (!fieldNames.length) { 
    return '(1=1)';
  }
  const strFilter = fieldNames.map(name => {
    let value = filter[name];
    if (value === undefined || value === null) {
      return `[${name}] IS NULL`
    }
    let operator = '=';
    if (isArray(value)) {
      operator = 'IN';
    }
    if ((value as any).$nin) {
      operator = "NOT IN";
      value = (value as any).$nin;
    } else if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 1 && keys[0].startsWith('$')) {
        const key = keys[0];
        value = value[key];
        if (key === '$exists') {
          if (value) {
            operator = "IS NOT";
          } else {
            operator = "IS";
          }
          value = null;
        } else {
          operator = key === '$ne' ? '<>' :
            key === '$gt' ? '>'  :
            key === '$gte' ? '>=' :
            key === '$lt' ? '<' :
            key === '$lte' ? '<=' : 
            null;
          if (operator === null) {
            throw new Error(`unknown operator: ${key}`);
          }
        }
      }
    } 
    let strValue = dataFieldScalarToSqlValue(value as (DataFieldScalar | DataFieldScalar[]));
    return `[${name}] ${operator} ${strValue}`;
  }).join(' AND ');
  return `(${strFilter})`;
}

function dataFieldScalarToSqlValue(value: DataFieldScalar | DataFieldScalar[]): string {
  if (isArray(value)) {
    return `(${value.map(v => `${dataFieldScalarToSqlValue(v)}`).join(', ')})`;
  }
  if (value === undefined || value === null) {
    return 'NULL';
  } else if (typeof value === 'boolean') {
    return value ? '1' : '0';
  } else if (typeof value === 'number') {
    return String(value);
  } else if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  } else if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  } else {
    throw new Error(`unknown data field type: ${value}`);
  }
}

export function dataFilterToSqlTextSearch(query: DataQuery<any>): string {
  const textSearch = query.textSearch();
  if (!textSearch) {
    return '';
  }
  const fieldNames = query.collection.fields.map(f => f.name);
  const strFilter = fieldNames.map(name => {
    return `[${name}] LIKE '%${textSearch.replace(/'/g, "''")}%'`;
  }).join(' OR ');
  return `(${strFilter})`;

}