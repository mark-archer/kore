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
exports.Autogrid = exports.AutoColumnsExcludedNames = void 0;
const knockout_1 = require("knockout");
const react_1 = __importStar(require("react"));
const hooks_1 = require("./hooks");
const datagrid_1 = require("./datagrid");
const utils_1 = require("../utils");
exports.AutoColumnsExcludedNames = [];
function Autogrid(params) {
    var _a, _b;
    params = Object.assign({}, params);
    let { primaryKey, newRow } = params;
    // resolve `data`.  
    if (!params.data && params.collection) {
        const [_obsData] = (0, react_1.useState)(() => params.collection.observables.list());
        params.data = _obsData;
    }
    if (!params.data) {
        throw new Error('data or collection must be passed in');
    }
    // convert data: Observable<T> to data: T[]
    let obsData;
    if ((0, knockout_1.isSubscribable)(params.data)) {
        obsData = params.data;
    }
    else {
        obsData = (0, knockout_1.observableArray)(params.data);
    }
    // automatically determine collection 
    const collection = params.collection || ((_b = (_a = (0, knockout_1.unwrap)(params.data)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.collection);
    // automatic newRow function
    const newRowCount = (0, hooks_1.useObservableState)(0);
    let _newRow;
    if (newRow === true || (newRow === undefined && !params.readOnly)) {
        // TODO if collection is missing this will fail
        newRow = () => collection.init();
    }
    if (typeof newRow === 'function') {
        _newRow = () => {
            const newDataRow = newRow();
            obsData.push(newDataRow);
            newRowCount(newRowCount() + 1);
        };
    }
    let columns = params.columns || (collection === null || collection === void 0 ? void 0 : collection.fields);
    if (!columns) {
        return react_1.default.createElement("p", null,
            "Loading... ",
            react_1.default.createElement("small", null,
                react_1.default.createElement("br", null),
                "(or no data and no columns)"));
    }
    if (!primaryKey) {
        primaryKey = collection.primaryKey;
    }
    if (!primaryKey) {
        throw new Error('primary key was not provide and cannot be inferred');
    }
    let autoColumns = false;
    if (columns === (collection === null || collection === void 0 ? void 0 : collection.fields)) {
        autoColumns = true;
    }
    columns = [...columns];
    if (autoColumns) {
        columns = columns.filter(c => !exports.AutoColumnsExcludedNames.includes(c.name));
    }
    // replace `*Id` with `*` for fk columns
    columns.forEach(c => {
        if (c.fkCollection && !c.displayName) {
            let displayName = c.name;
            if (displayName.endsWith('Id')) {
                displayName = displayName.substring(0, c.name.length - 2).trim();
                c.displayName = (0, utils_1.camelCaseToSpaces)(displayName);
            }
        }
    });
    if (params.readOnly === true || params.readOnly === false) {
        columns.forEach(c => {
            if (exports.AutoColumnsExcludedNames.map(s => s.toLowerCase()).includes(c.name.toLowerCase())) {
                return;
            }
            if (c.readOnly !== true && c.readOnly !== false) {
                c.readOnly = params.readOnly;
            }
        });
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
                    (0, hooks_1.useObservable)(doc.q);
                    if (doc.isNew)
                        return react_1.default.createElement("span", null);
                    return (react_1.default.createElement("button", { ref: ref, className: 'btn btn-primary', onClick: evt => {
                            params.onGoto(doc);
                        } },
                        react_1.default.createElement("i", { className: "bi bi-box-arrow-up-right" })));
                }
            });
        }
    }
    if ((params.showSave || params.onSave) || (!params.readOnly && params.showSave !== false)) {
        const onSave = (doc) => {
            if (params.onSave)
                return params.onSave(doc);
            doc.save()
                .catch(err => {
                console.error(err);
            });
        };
        columns.push({
            displayName: ' ',
            name: 'Save',
            width: '10px',
            getContent: (doc, ref) => {
                (0, hooks_1.useObservable)(doc.q);
                if (doc.q() === 0) {
                    return (react_1.default.createElement("button", { ref: ref, className: 'btn btn-outline-secondary', disabled: true }, "Save"));
                }
                else {
                    return (react_1.default.createElement("button", { ref: ref, className: 'btn btn-primary', onClick: evt => onSave(doc) }, "Save"));
                }
            }
        });
    }
    const [_data, setData] = (0, hooks_1.useObservable)(obsData);
    if (params.showDelete !== false && (params.onDelete || !params.readOnly)) {
        const onDelete = (doc) => {
            if (params.onDelete)
                return params.onDelete(doc);
            if (doc.isNew || confirm(`Are you sure you want to delete ${doc.displayValue()}?`)) {
                doc.delete();
                setData(_data.filter(d => d !== doc));
            }
        };
        columns.push({
            displayName: ' ',
            name: 'Delete',
            width: '10px',
            tdStyle: { textAlign: 'center', verticalAlign: 'middle' },
            getContent: (doc, ref) => {
                return (react_1.default.createElement("button", { ref: ref, className: 'btn btn-danger btn-sm', onClick: () => onDelete(doc) },
                    react_1.default.createElement("i", { className: "bi bi-trash" })));
            }
        });
    }
    (0, hooks_1.useObservable)(params.page);
    (0, hooks_1.useObservable)(params.pageSize);
    (0, hooks_1.useObservable)(params.searchText);
    const datagridParams = Object.assign(Object.assign({ defaultSort: 'id' }, params), { page: (0, knockout_1.unwrap)(params.page), pageSize: (0, knockout_1.unwrap)(params.pageSize), searchText: (0, knockout_1.unwrap)(params.searchText), columns,
        primaryKey, data: _data, newRow: _newRow });
    return (react_1.default.createElement(datagrid_1.Datagrid, Object.assign({ cacheSortWithId: collection === null || collection === void 0 ? void 0 : collection.entityName }, datagridParams)));
}
exports.Autogrid = Autogrid;
//# sourceMappingURL=autogrid.js.map