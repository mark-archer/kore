import { computed, isSubscribable, observable, Observable, unwrap } from 'knockout';
import React, { useRef, useState } from 'react';
import _, { isNumber, sumBy } from 'lodash';
import { camelCaseToSpaces, moneyFormatter } from '../utils';
import { persistentValue, useObservable, useObservableArrayState } from './hooks';
import { IField } from '../orm/collection';
import { IDoc } from '../orm/doc';
import { TypeaheadFK } from './typeahead-fk'
import { InputNumber } from './input-number';


export interface IDatagridField<T> extends Partial<IField> {
  name: string
  readOnly?: boolean
  width?: any
  disabled?: (doc: IDoc<T>) => boolean
  getContent?: (doc: IDoc<T>, ref: React.MutableRefObject<undefined>) => any
  getHeader?: () => any
  getValue?: (doc: IDoc<T>, ref: React.MutableRefObject<undefined>) => any
  tdStyle?: any
  showTotal?: boolean | ((docs: IDoc<T>[]) => any)
}

export interface IDatagridParams<T> {
  data: IDoc<T>[]
  columns: IDatagridField<T>[]
  primaryKey: IField
  newRow?: () => any | false
  defaultSort?: string
  disableSorting?: boolean
  searchText?: string
  page?: number
  pageSize?: number
  cacheSortWithId?: string
  selectedRow?: Observable<IDoc<T>>
}

export const sortCache = persistentValue<{ [sortId: string]: string[] }>({}, 'datagridSortCache');

export function Datagrid<T>(params: IDatagridParams<T>) {
  const { primaryKey, columns, newRow, defaultSort, cacheSortWithId, pageSize, searchText } = params;
  let { page } = params;
  let data = [...params.data];
  let selectedRow = params.selectedRow || observable<IDoc<T>>(null);

  const [cellState]: any = useState(() => ({} as Record<string, any>));
  const [focusOnNewRow, setFocusOnNewRow] = useState(false);
  cellState.maxIRow = data.length - 1;
  cellState.maxICol = columns.length - 1;
  // cellState.data = data;
  // cellState.selectedRow = selectedRow;

  const _defaultSort = cacheSortWithId && sortCache()[cacheSortWithId]?.length
    ? sortCache()[cacheSortWithId]
    : (defaultSort || '').split(',').reverse().filter(s => s);
  const sortFields = useObservableArrayState<string>(_defaultSort);
  const showTotals = columns.some(c => c.showTotal);

  const strSortBy = sortFields().join(',');
  const strPriorSortBy = (data as any).sortOrder as string;
  if (strSortBy !== strPriorSortBy) {
    const _sortFields = [...sortFields()].reverse();
    for (let sortField of _sortFields) {
      let sortDirection = 1;
      if (sortField[0] === '-') {
        sortDirection = -1;
        sortField = sortField.substring(1);
      }
      const col = columns.find(c => c.name === sortField);
      data.sort((a, b) => {
        if (a.isNew) {
          return 2; // new items always go at the bottom
        }
        // convert undefined to blank because undefined doesn't sort
        const aValue = (col?.getValue ? col.getValue(a, null) : a[sortField]) ?? '';
        const bValue = (col?.getValue ? col.getValue(b, null) : b[sortField]) ?? '';
        if (aValue < bValue) {
          return -sortDirection;
        } else if (aValue > bValue) {
          return sortDirection;
        } else {
          return 0;
        }
      })
    }
    (data as any).sortOrder = strSortBy;
  }

  function toggleSort(col: IDatagridField<T>) {
    if (!col.name || (col.getContent && !col.getValue)) {
      return;
    }
    const fieldName = col.name;
    const sortDesc = '-' + fieldName;
    if (sortFields().includes(fieldName)) {
      sortFields.remove(fieldName);
      sortFields.unshift(sortDesc);
    } else if (sortFields().includes(sortDesc)) {
      sortFields.remove(sortDesc);
    } else {
      sortFields.unshift(fieldName);
    }

    if (cacheSortWithId) {
      sortCache({ ...sortCache(), [cacheSortWithId]: [...sortFields()] });
    }
  }

  // filter by search text
  if (searchText) {
    data = data.filter((d) => {
      // always show new items
      if (d.isNew) {
        return true;
      }
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
  }

  // limit to page size
  if (pageSize) {
    if (searchText) {
      page = 1;
    }
    const iStart = (page - 1) * pageSize;
    const iEnd = iStart + pageSize;
    const newRows = data.filter(d => d.isNew);
    data = data.filter(d => !d.isNew).slice(iStart, iEnd);
    data.push(...newRows)
  }

  const newRowBtn = useRef();
  cellState.newRowBtn = newRowBtn;

  function _newRow() {
    console.log('new row clicked');
    newRow?.();
    cellState.focusOnNewRow = true;
    setFocusOnNewRow(true);
  }

  if (focusOnNewRow) {
    setFocusOnNewRow(false);
  }

  if (focusOnNewRow || cellState.focusOnNewRow) {
    const newIRow = data.length - 1;
    setTimeout(() => {
      focusOnCell(cellState, newIRow, 0);
      setFocusOnNewRow(false);
      cellState.focusOnNewRow = false;
    }, 100);
  }

  return (
    <div>
      <table className="table table-striped table-hover table-bordered">
        {/* headers */}
        <thead>
          <tr>
            {/* {[primaryKey, ...columns].map((col: IDatagridField<T>) => */}
            {columns.map((col: IDatagridField<T>) =>
              <th key={col.name} scope="col" style={{ width: col.width }}
                onClick={evt => !params.disableSorting && toggleSort(col)}
              >
                <span style={{ cursor: 'pointer' }}>
                  {col.getHeader?.() || col.displayName || camelCaseToSpaces(col.name)}
                </span>
                {/* sort indicator */}
                {sortFields().includes(col.name) &&
                  <span>
                    &nbsp; <i className="bi bi-sort-down-alt"></i>
                  </span>
                }
                {sortFields().includes('-' + col.name) &&
                  <span>
                    &nbsp; <i className="bi bi-sort-up"></i>
                  </span>
                }
              </th>
            )}
          </tr>
        </thead>

        {/* rows */}
        <tbody>
          {data.map((rowData, iRow) =>
            <DataRow 
              key={rowData[primaryKey.name] || Math.random()} 
              rowData={rowData} 
              columns={columns} 
              primaryKey={primaryKey} 
              iRow={iRow} 
              cellState={cellState} 
              selectedRow={selectedRow}
            />
          )}
        </tbody>

        {/* new row */}
        {newRow &&
          <tfoot>
            <tr>
              <th scope="row" onKeyDown={evt =>
                onCellKeyDown(evt, cellState, data.length, 0)}>
                <button ref={newRowBtn} className="btn btn-outline-secondary btn-sm" onClick={_newRow}
                  style={{ fontSize: '20px' }}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </th>
            </tr>
          </tfoot>
        }

        {/* totals */}
        {showTotals && (
          <tfoot>
            <tr>
              {columns.map((col, i) => {
                if (!col.showTotal) {
                  return (
                    <td key={i}></td>
                  )
                }
                if (col.showTotal === true) {
                  return (
                    <td key={i} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {format(sumBy(data, col.name), col)}
                    </td>
                  )
                } else {
                  return <td key={i}>{col.showTotal(data)}</td>
                }
              })}
            </tr>
          </tfoot>
        )}

      </table>
    </div>
  )
}

function format(data: any, column: IDatagridField<any>): string {
  if (data === null || data === undefined) {
    return '';
  }
  if (column.format === 'money') {
    if (!isNumber(data)) return String(data);
    return moneyFormatter.format(data);
  }
  if (column.format === 'date') {
    return (new Date(data))?.toLocaleDateString?.() || "";
  }
  if (column.dataType == 'Date' || column.format === 'datetime') {
    // return (data as Date)?.toString?.() || "";
    // return (data as Date)?.toLocaleDateString?.() || "";
    // return (data as Date)?.toLocaleString?.() || "";
    return (new Date(data))?.toLocaleString?.() || "";
  }
  return String(data);
}

interface IDataRowParams<T> {
  rowData: IDoc<T>
  columns: IDatagridField<T>[]
  primaryKey: IDatagridField<T>
  iRow: number
  cellState: any
  selectedRow: Observable<IDoc<T>>
}

const DataRow: <T>(params: IDataRowParams<T>) => any =
  React.memo(function <T>({ rowData, columns, primaryKey, iRow, cellState, selectedRow }: IDataRowParams<T>) {
    const [validationError] = useObservable(rowData.validationError);
    const [selectedRowValue] = useObservable(selectedRow);
    return (
      <tr key={rowData[primaryKey.name] || Math.random()}
        className={validationError ? 'table-danger' : ''}
        onFocus={() => selectedRow(rowData)}
        style={{ 
          backgroundColor: selectedRowValue === rowData ? 'rgba(173, 216, 230, 0.51)' : ''
        }}
      >
        {columns.map((column, iCol) => {
          return (
            <td key={column.name} style={styleCellTd(rowData, column)} onKeyDown={evt => onCellKeyDown(evt, cellState, iRow, iCol)}>
              <DataCell doc={rowData} column={column} iCol={iCol} iRow={iRow} cellState={cellState} />
            </td>
          )
        })}
      </tr>
    )
  }) as any

interface IDataCellParams<T> {
  doc: IDoc<T>
  column: IDatagridField<T>
  iRow: number
  iCol: number
  cellState: any
}

// @ts-ignore
const DataCell: <T>(params: IDataCellParams<T>) => any = React.memo(function <T>({ doc, column, iCol, iRow, cellState }: IDataCellParams<T>) {
  const ref = useRef();
  cellState[`${iRow},${iCol}`] = ref;

  if (column.getContent) {
    return column.getContent(doc, ref)
  }

  let sub = doc.qs?.[column.name] as Observable<any>;
  if (!sub && isSubscribable(doc[column.name])) {
    sub = doc[column.name];
  }

  if (!sub) {
    sub = computed({
      read: () => {
        return doc[column.name];
      },
      write: (newValue) => {
        doc[column.name] = newValue;
      }
    }) as any;

    if (doc.q) {
      useObservable(doc.q);
    }
  }
  useObservable(sub);

  if (column.fkCollection && sub) {
    return (
      <TypeaheadFK
        innerRef={ref}
        fkCollection={column.fkCollection}
        fkId={sub}
        readOnly={column.readOnly}
        dataGridColumn={column as any}
      />
    )
  }

  const style: any = {};
  if (column.dataType === 'number') {
    style.textAlign = 'right';
  }

  if (column.readOnly) {
    return (
      <span style={style}>
        {format(unwrap(doc[column.name]), column)}
      </span>
    )
  }

  let [value, setValue] = useObservable(sub)
  value = value ?? "";
  // console.log('DataCell', value, doc)
  let onChange = (evt) => {
    let newValue: any = evt.target.value;
    if (column.dataType === 'Date') {
      newValue = newValue ? new Date(newValue) : null;
    } else if (column.dataType === 'boolean') {
      newValue = Boolean(evt.target.checked);
    } else if (column.dataType === 'number') {
      // doc[column.name] = Number.parseFloat(newValue);
      newValue = Number.parseFloat(newValue);
    }
    setValue(newValue);
  }

  let inputType = '';
  let className = "form-control";
  let checked: boolean;
  if (column.dataType === 'Date') {
    inputType = 'date';
    value = value?.toISOString?.().substr(0, 10) || value;
  } else if (column.dataType === 'boolean') {
    inputType = 'checkbox';
    value = Boolean(value);
    checked = value;
    className = "";
  }

  // input type='number' isn't a good user experience (e.g. can't type '-' as first char) so we're hand-rolling
  if (column.dataType === 'number') {
    const comp = computed<number>({
      read: () => value,
      write: (newValue) => setValue(newValue)
    });
    const format = column.format === "money" ? "money" : undefined;
    return (
      <InputNumber value={comp} format={format} style={style} className={className} refPassthrough={ref} />
    );
  }

  return (
    <input ref={ref} {...{ type: inputType, className, value, onChange, checked }} style={style} />
  )

}) as any;

function styleCellTd<T>(rowData: IDoc<T>, column: IDatagridField<T>): React.CSSProperties {
  const { dataType, format } = column;
  const isFk = column.fkCollection || column.fkType;
  let textAlign: any =
    dataType === 'boolean' ? 'center' :
      dataType === 'number' && !isFk ? 'right' :
        format === 'money' ? 'right' :
          '';
  return {
    textAlign,
    ...(column.tdStyle ?? {}),
    // @ts-ignore
    ...(rowData.tdStyle ?? {}),
  }
}

function getSelectedText(elem) {
  if (elem.tagName === "TEXTAREA" || (elem.tagName === "INPUT" && elem.type === 'text')) {
    return elem.value.substring(elem.selectionStart, elem.selectionEnd);
  }
  return null;
}

function focusOnCell(cellState, iRow: number, iCol: number, direction: 'next' | 'prev' = 'next') {
  const { maxIRow, maxICol, newRowBtn } = cellState;
  // const { data, selectedRow } = cellState;
  if (direction === 'next') {
    while (iRow <= maxIRow) {
      while (iCol <= maxICol) {
        const ref = cellState[`${iRow},${iCol}`];
        if (ref?.current?.focus && !ref?.current?.disabled /*TODO zIndex === -1*/) {
          ref.current.focus();
          ref.current.select?.();
          // selectedRow(data[iRow]);
          return;
        }
        iCol++;
      }
      iRow++;
      iCol = 0;
    }
  } else {
    while (iRow >= 0) {
      while (iCol >= 0) {
        const ref = cellState[`${iRow},${iCol}`];
        if (ref?.current?.focus && !ref?.current?.disabled /*TODO zIndex === -1*/) {
          ref.current.focus();
          ref.current.select?.();
          // selectedRow(data[iRow]);
          return;
        }
        iCol--;
      }
      iRow--;
      iCol = maxICol;
    }
  }
  if (direction === 'next') {
    newRowBtn.current?.focus();
    return;
  }
}

function onCellKeyDown(evt: React.KeyboardEvent<HTMLTableCellElement>, cellState, iRow: number, iCol: number) {
  var key = evt.keyCode;
  var meta = evt.metaKey;
  var ctrl = evt.ctrlKey;
  var alt = evt.altKey;
  var shift = evt.shiftKey;
  var mods = meta || ctrl || alt || shift;

  if (mods) return;

  const elemTag = (evt.target as any)?.tagName;
  const selectedText = getSelectedText(evt.target);
  const cursorPosition = (evt.target as any).selectionStart ?? null;
  const fullText = (evt.target as any).value;
  const thisCell = cellState[`${iRow},${iCol}`];
  const isTypeahead = thisCell?.current?.instancePrefix?.startsWith('react-select');

  // enter -> go to first editable cell on next row
  if (key === 13) {
    // if it's a typeahead don't do anything with enter (todo try to detect if dropdown is open)
    if (isTypeahead) {
      return;
    }
    if (elemTag === 'BUTTON') {
      // solves case where button becomes disabled after clicking it, focuses on whatever is next in line
      setTimeout(() => focusOnCell(cellState, iRow, iCol, 'next'), 100);
      return;
    }
    focusOnCell(cellState, iRow + 1, 0);
    evt.preventDefault();
    evt.stopPropagation();
  }

  // up -> try to focus on the cell above (might need to keep going up if can't focus?)
  if (key === 38) {
    focusOnCell(cellState, iRow - 1, iCol, 'next');
    evt.preventDefault();
    evt.stopPropagation();
  }

  // down -> try to focus on the cell below
  if (key === 40) {
    // if it's a typeahead don't do anything with arrow down
    if (isTypeahead) {
      return;
    }
    focusOnCell(cellState, iRow + 1, iCol)
    evt.preventDefault();
    evt.stopPropagation();
  }

  // right -> try to focus on cell to the right
  if (key === 39) {
    if (selectedText === fullText || cursorPosition >= fullText?.length || cursorPosition === null) {
      focusOnCell(cellState, iRow, iCol + 1)
      evt.preventDefault();
      evt.stopPropagation();

    }
  }

  // left -> try to focus on cell to the left
  if (key === 37) {
    if (selectedText === fullText || cursorPosition <= 0 || cursorPosition === null) {
      focusOnCell(cellState, iRow, iCol - 1, 'prev')
      evt.preventDefault();
      evt.stopPropagation();

    }
  }

  // // pgDwn -> pageNum + 1
  // if (key === 34 && !mods) {
  //   self.pageUp();
  //   evt.preventDefault();
  //   setTimeout(function () {
  //     for (var i = 0; i < self.cells.maxCol; i++) {
  //       var cell = self.cells["0," + i];
  //       if (cell && cell.editable) {
  //         cell.element.focus();
  //         if (cell.element.select) cell.element.select();
  //         self.selectedItem(cell.data);
  //         evt.preventDefault();
  //         break;
  //       }
  //     }
  //   }, 250)
  // }

  // // pgUp -> pageNum - 1
  // if (key === 33 && !mods) {
  //   self.pageDown();
  //   evt.preventDefault();
  //   setTimeout(function () {
  //     for (var i = 0; i < self.cells.maxCol; i++) {
  //       var cell = self.cells["0," + i];
  //       if (cell && cell.editable) {
  //         cell.element.focus();
  //         if (cell.element.select) cell.element.select();
  //         self.selectedItem(cell.data);
  //         evt.preventDefault();
  //         break;
  //       }
  //     }
  //   }, 250)
  // }
  //console.log(key)
}
