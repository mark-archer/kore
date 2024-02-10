"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Datagrid = exports.sortCache = void 0;
const knockout_1 = require("knockout");
const react_1 = __importStar(require("react"));
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const hooks_1 = require("./hooks");
const typeahead_fk_1 = require("./typeahead-fk");
const input_number_1 = require("./input-number");
exports.sortCache = (0, hooks_1.persistentValue)({}, 'datagridSortCache');
function Datagrid(params) {
    var _a;
    const { primaryKey, columns, newRow, defaultSort, cacheSortWithId, pageSize, searchText } = params;
    let { page } = params;
    let data = [...params.data];
    let selectedRow = params.selectedRow || (0, knockout_1.observable)(null);
    const [cellState] = (0, react_1.useState)(() => ({}));
    const [focusOnNewRow, setFocusOnNewRow] = (0, react_1.useState)(false);
    cellState.maxIRow = data.length - 1;
    cellState.maxICol = columns.length - 1;
    // cellState.data = data;
    // cellState.selectedRow = selectedRow;
    const _defaultSort = cacheSortWithId && ((_a = (0, exports.sortCache)()[cacheSortWithId]) === null || _a === void 0 ? void 0 : _a.length)
        ? (0, exports.sortCache)()[cacheSortWithId]
        : (defaultSort || '').split(',').reverse().filter(s => s);
    const sortFields = (0, hooks_1.useObservableArrayState)(_defaultSort);
    const showTotals = columns.some(c => c.showTotal);
    const strSortBy = sortFields().join(',');
    const strPriorSortBy = data.sortOrder;
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
                var _a, _b;
                if (a.isNew) {
                    return 2; // new items always go at the bottom
                }
                // convert undefined to blank because undefined doesn't sort
                const aValue = (_a = ((col === null || col === void 0 ? void 0 : col.getValue) ? col.getValue(a, null) : a[sortField])) !== null && _a !== void 0 ? _a : '';
                const bValue = (_b = ((col === null || col === void 0 ? void 0 : col.getValue) ? col.getValue(b, null) : b[sortField])) !== null && _b !== void 0 ? _b : '';
                if (aValue < bValue) {
                    return -sortDirection;
                }
                else if (aValue > bValue) {
                    return sortDirection;
                }
                else {
                    return 0;
                }
            });
        }
        data.sortOrder = strSortBy;
    }
    function toggleSort(col) {
        if (!col.name || (col.getContent && !col.getValue)) {
            return;
        }
        const fieldName = col.name;
        const sortDesc = '-' + fieldName;
        if (sortFields().includes(fieldName)) {
            sortFields.remove(fieldName);
            sortFields.unshift(sortDesc);
        }
        else if (sortFields().includes(sortDesc)) {
            sortFields.remove(sortDesc);
        }
        else {
            sortFields.unshift(fieldName);
        }
        if (cacheSortWithId) {
            (0, exports.sortCache)(Object.assign(Object.assign({}, (0, exports.sortCache)()), { [cacheSortWithId]: [...sortFields()] }));
        }
    }
    // filter by search text
    if (searchText) {
        data = data.filter((d) => {
            var _a;
            // always show new items
            if (d.isNew) {
                return true;
            }
            let _searchText = searchText.toLowerCase();
            // this matches fk fields (and other special fields) with custom values
            const match = columns.some(column => {
                var _a;
                const text = JSON.stringify((_a = column === null || column === void 0 ? void 0 : column.getValue) === null || _a === void 0 ? void 0 : _a.call(column, d, null));
                return text === null || text === void 0 ? void 0 : text.toLowerCase().includes(_searchText);
            });
            if (match) {
                return match;
            }
            return JSON.stringify(((_a = d === null || d === void 0 ? void 0 : d.toJS) === null || _a === void 0 ? void 0 : _a.call(d)) || d).toLowerCase().includes(_searchText);
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
        data.push(...newRows);
    }
    const newRowBtn = (0, react_1.useRef)();
    cellState.newRowBtn = newRowBtn;
    function _newRow() {
        console.log('new row clicked');
        newRow === null || newRow === void 0 ? void 0 : newRow();
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
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("table", { className: "table table-striped table-hover table-bordered" },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", null, columns.map((col) => {
                    var _a;
                    return react_1.default.createElement("th", { key: col.name, scope: "col", style: { width: col.width }, onClick: evt => !params.disableSorting && toggleSort(col) },
                        react_1.default.createElement("span", { style: { cursor: 'pointer' } }, ((_a = col.getHeader) === null || _a === void 0 ? void 0 : _a.call(col)) || col.displayName || (0, utils_1.camelCaseToSpaces)(col.name)),
                        sortFields().includes(col.name) &&
                            react_1.default.createElement("span", null,
                                "\u00A0 ",
                                react_1.default.createElement("i", { className: "bi bi-sort-down-alt" })),
                        sortFields().includes('-' + col.name) &&
                            react_1.default.createElement("span", null,
                                "\u00A0 ",
                                react_1.default.createElement("i", { className: "bi bi-sort-up" })));
                }))),
            react_1.default.createElement("tbody", null, data.map((rowData, iRow) => react_1.default.createElement(DataRow, { key: rowData[primaryKey.name] || Math.random(), rowData: rowData, columns: columns, primaryKey: primaryKey, iRow: iRow, cellState: cellState, selectedRow: selectedRow }))),
            newRow &&
                react_1.default.createElement("tfoot", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { scope: "row", onKeyDown: evt => onCellKeyDown(evt, cellState, data.length, 0) },
                            react_1.default.createElement("button", { ref: newRowBtn, className: "btn btn-outline-secondary btn-sm", onClick: _newRow, style: { fontSize: '20px' } },
                                react_1.default.createElement("i", { className: "bi bi-plus" }))))),
            showTotals && (react_1.default.createElement("tfoot", null,
                react_1.default.createElement("tr", null, columns.map((col, i) => {
                    if (!col.showTotal) {
                        return (react_1.default.createElement("td", { key: i }));
                    }
                    if (col.showTotal === true) {
                        return (react_1.default.createElement("td", { key: i, style: { textAlign: 'right', fontWeight: 'bold' } }, format((0, lodash_1.sumBy)(data, col.name), col)));
                    }
                    else {
                        return react_1.default.createElement("td", { key: i }, col.showTotal(data));
                    }
                })))))));
}
exports.Datagrid = Datagrid;
function format(data, column) {
    var _a, _b, _c, _d;
    if (data === null || data === undefined) {
        return '';
    }
    if (column.format === 'money') {
        if (!(0, lodash_1.isNumber)(data))
            return String(data);
        return utils_1.moneyFormatter.format(data);
    }
    if (column.format === 'date') {
        return ((_b = (_a = (new Date(data))) === null || _a === void 0 ? void 0 : _a.toLocaleDateString) === null || _b === void 0 ? void 0 : _b.call(_a)) || "";
    }
    if (column.dataType == 'Date' || column.format === 'datetime') {
        // return (data as Date)?.toString?.() || "";
        // return (data as Date)?.toLocaleDateString?.() || "";
        // return (data as Date)?.toLocaleString?.() || "";
        return ((_d = (_c = (new Date(data))) === null || _c === void 0 ? void 0 : _c.toLocaleString) === null || _d === void 0 ? void 0 : _d.call(_c)) || "";
    }
    return String(data);
}
const DataRow = react_1.default.memo(function ({ rowData, columns, primaryKey, iRow, cellState, selectedRow }) {
    const [validationError] = (0, hooks_1.useObservable)(rowData.validationError);
    const [selectedRowValue] = (0, hooks_1.useObservable)(selectedRow);
    return (react_1.default.createElement("tr", { key: rowData[primaryKey.name] || Math.random(), className: validationError ? 'table-danger' : '', onFocus: () => selectedRow(rowData), onClick: () => selectedRow(rowData), style: {
            backgroundColor: selectedRowValue === rowData ? 'rgba(173, 216, 230, 0.51)' : ''
        } }, columns.map((column, iCol) => {
        return (react_1.default.createElement("td", { key: column.name, style: styleCellTd(rowData, column), onKeyDown: evt => onCellKeyDown(evt, cellState, iRow, iCol) },
            react_1.default.createElement(DataCell, { doc: rowData, column: column, iCol: iCol, iRow: iRow, cellState: cellState })));
    })));
});
// @ts-ignore
const DataCell = react_1.default.memo(function ({ doc, column, iCol, iRow, cellState }) {
    var _a, _b;
    const ref = (0, react_1.useRef)();
    cellState[`${iRow},${iCol}`] = ref;
    if (column.getContent) {
        return column.getContent(doc, ref);
    }
    let sub = (_a = doc.qs) === null || _a === void 0 ? void 0 : _a[column.name];
    if (!sub && (0, knockout_1.isSubscribable)(doc[column.name])) {
        sub = doc[column.name];
    }
    if (!sub) {
        sub = (0, knockout_1.computed)({
            read: () => {
                return doc[column.name];
            },
            write: (newValue) => {
                doc[column.name] = newValue;
            }
        });
        if (doc.q) {
            (0, hooks_1.useObservable)(doc.q);
        }
    }
    (0, hooks_1.useObservable)(sub);
    if (column.fkCollection && sub) {
        return (react_1.default.createElement(typeahead_fk_1.TypeaheadFK, { innerRef: ref, fkCollection: column.fkCollection, fkId: sub, readOnly: column.readOnly, dataGridColumn: column }));
    }
    const style = {};
    if (column.dataType === 'number') {
        style.textAlign = 'right';
    }
    if (column.readOnly) {
        return (react_1.default.createElement("span", { style: style }, format((0, knockout_1.unwrap)(doc[column.name]), column)));
    }
    let [value, setValue] = (0, hooks_1.useObservable)(sub);
    value = value !== null && value !== void 0 ? value : "";
    // console.log('DataCell', value, doc)
    let onChange = (evt) => {
        let newValue = evt.target.value;
        if (column.dataType === 'Date') {
            newValue = newValue ? new Date(newValue) : null;
        }
        else if (column.dataType === 'boolean') {
            newValue = Boolean(evt.target.checked);
        }
        else if (column.dataType === 'number') {
            // doc[column.name] = Number.parseFloat(newValue);
            newValue = Number.parseFloat(newValue);
        }
        setValue(newValue);
    };
    let inputType = '';
    let className = "form-control";
    let checked;
    if (column.dataType === 'Date') {
        inputType = 'date';
        value = ((_b = value === null || value === void 0 ? void 0 : value.toISOString) === null || _b === void 0 ? void 0 : _b.call(value).substr(0, 10)) || value;
    }
    else if (column.dataType === 'boolean') {
        inputType = 'checkbox';
        value = Boolean(value);
        checked = value;
        className = "";
    }
    // input type='number' isn't a good user experience (e.g. can't type '-' as first char) so we're hand-rolling
    if (column.dataType === 'number') {
        const comp = (0, knockout_1.computed)({
            read: () => value,
            write: (newValue) => setValue(newValue)
        });
        const format = column.format === "money" ? "money" : undefined;
        return (react_1.default.createElement(input_number_1.InputNumber, { value: comp, format: format, style: style, className: className, refPassthrough: ref }));
    }
    return (react_1.default.createElement("input", Object.assign({ ref: ref }, { type: inputType, className, value, onChange, checked }, { style: style })));
});
function styleCellTd(rowData, column) {
    var _a, _b;
    const { dataType, format } = column;
    const isFk = column.fkCollection || column.fkType;
    let textAlign = dataType === 'boolean' ? 'center' :
        dataType === 'number' && !isFk ? 'right' :
            format === 'money' ? 'right' :
                '';
    return Object.assign(Object.assign({ textAlign }, ((_a = column.tdStyle) !== null && _a !== void 0 ? _a : {})), ((_b = rowData.tdStyle) !== null && _b !== void 0 ? _b : {}));
}
function getSelectedText(elem) {
    if (elem.tagName === "TEXTAREA" || (elem.tagName === "INPUT" && elem.type === 'text')) {
        return elem.value.substring(elem.selectionStart, elem.selectionEnd);
    }
    return null;
}
function focusOnCell(cellState, iRow, iCol, direction = 'next') {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { maxIRow, maxICol, newRowBtn } = cellState;
    // const { data, selectedRow } = cellState;
    if (direction === 'next') {
        while (iRow <= maxIRow) {
            while (iCol <= maxICol) {
                const ref = cellState[`${iRow},${iCol}`];
                if (((_a = ref === null || ref === void 0 ? void 0 : ref.current) === null || _a === void 0 ? void 0 : _a.focus) && !((_b = ref === null || ref === void 0 ? void 0 : ref.current) === null || _b === void 0 ? void 0 : _b.disabled) /*TODO zIndex === -1*/) {
                    ref.current.focus();
                    (_d = (_c = ref.current).select) === null || _d === void 0 ? void 0 : _d.call(_c);
                    // selectedRow(data[iRow]);
                    return;
                }
                iCol++;
            }
            iRow++;
            iCol = 0;
        }
    }
    else {
        while (iRow >= 0) {
            while (iCol >= 0) {
                const ref = cellState[`${iRow},${iCol}`];
                if (((_e = ref === null || ref === void 0 ? void 0 : ref.current) === null || _e === void 0 ? void 0 : _e.focus) && !((_f = ref === null || ref === void 0 ? void 0 : ref.current) === null || _f === void 0 ? void 0 : _f.disabled) /*TODO zIndex === -1*/) {
                    ref.current.focus();
                    (_h = (_g = ref.current).select) === null || _h === void 0 ? void 0 : _h.call(_g);
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
        (_j = newRowBtn.current) === null || _j === void 0 ? void 0 : _j.focus();
        return;
    }
}
function onCellKeyDown(evt, cellState, iRow, iCol) {
    var _a, _b, _c, _d;
    var key = evt.keyCode;
    var meta = evt.metaKey;
    var ctrl = evt.ctrlKey;
    var alt = evt.altKey;
    var shift = evt.shiftKey;
    var mods = meta || ctrl || alt || shift;
    if (mods)
        return;
    const elemTag = (_a = evt.target) === null || _a === void 0 ? void 0 : _a.tagName;
    const selectedText = getSelectedText(evt.target);
    const cursorPosition = (_b = evt.target.selectionStart) !== null && _b !== void 0 ? _b : null;
    const fullText = evt.target.value;
    const thisCell = cellState[`${iRow},${iCol}`];
    const isTypeahead = (_d = (_c = thisCell === null || thisCell === void 0 ? void 0 : thisCell.current) === null || _c === void 0 ? void 0 : _c.instancePrefix) === null || _d === void 0 ? void 0 : _d.startsWith('react-select');
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
        focusOnCell(cellState, iRow + 1, iCol);
        evt.preventDefault();
        evt.stopPropagation();
    }
    // right -> try to focus on cell to the right
    if (key === 39) {
        if (selectedText === fullText || cursorPosition >= (fullText === null || fullText === void 0 ? void 0 : fullText.length) || cursorPosition === null) {
            focusOnCell(cellState, iRow, iCol + 1);
            evt.preventDefault();
            evt.stopPropagation();
        }
    }
    // left -> try to focus on cell to the left
    if (key === 37) {
        if (selectedText === fullText || cursorPosition <= 0 || cursorPosition === null) {
            focusOnCell(cellState, iRow, iCol - 1, 'prev');
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
//# sourceMappingURL=datagrid.js.map