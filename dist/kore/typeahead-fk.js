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
exports.TypeaheadFK = void 0;
const react_1 = __importStar(require("react"));
const typeahead_1 = require("./typeahead");
const knockout_1 = require("knockout");
const hooks_1 = require("./hooks");
const utils_1 = require("../utils");
const supportTableEntries = {};
const supportTables = []; //[GLAccountTypes, GLBalanceTypes];
const fkColumnValueCache = {};
function TypeaheadFK(props) {
    var _a;
    const { fkCollection } = props;
    const [fkId, setFkId] = (0, hooks_1.useObservable)(props.fkId);
    const [docObs] = (0, react_1.useState)(() => (0, knockout_1.observable)());
    const [doc, setDoc] = (0, hooks_1.useObservable)(docObs);
    (0, hooks_1.useObservable)(props.options);
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
    (0, react_1.useEffect)(() => {
        if ((doc === null || doc === void 0 ? void 0 : doc.primaryKey()) === fkId)
            return;
        if (options) {
            const opt = options().find(o => o.primaryKey() === fkId);
            setDoc(opt);
            return;
        }
        // get all values from db for these supportTables
        if (supportTables.map(t => t.name).includes(fkCollection.entityName)) {
            // get doc from list of support table entries, if support table entries are loaded, wait for load
            const _doc = supportTableEntries[fkCollection.entityName]().find(i => i.primaryKey() === fkId);
            if (_doc) {
                setDoc(_doc);
            }
            else {
                let sub = supportTableEntries[fkCollection.entityName].subscribe(() => {
                    sub.dispose();
                    const _doc = supportTableEntries[fkCollection.entityName]().find(i => i.primaryKey() === fkId);
                    setDoc(_doc);
                });
            }
        }
        else {
            fkCollection.get(fkId).then(doc => setDoc(doc));
        }
    }, [fkId, options === null || options === void 0 ? void 0 : options()]);
    const displayField = (doc) => {
        var _a, _b;
        const displayValue = (_a = doc === null || doc === void 0 ? void 0 : doc.displayValue) === null || _a === void 0 ? void 0 : _a.call(doc);
        if ((_b = props.dataGridColumn) === null || _b === void 0 ? void 0 : _b.name) {
            const value = displayValue;
            // const value = doc?.sortOrder ?? displayValue;
            fkColumnValueCache[`${props.dataGridColumn.name}-${doc.primaryKey()}`] = value;
        }
        return displayValue;
    };
    // allows sorting by value of typeahead 
    if (props.dataGridColumn && !props.dataGridColumn.getValue) {
        props.dataGridColumn.getValue = (doc, ref) => {
            const colName = props.dataGridColumn.name;
            const colValue = doc[colName];
            return fkColumnValueCache[`${colName}-${colValue}`];
        };
    }
    // show error if fkId not available in options
    if (fkId && !doc && ((_a = options === null || options === void 0 ? void 0 : options()) === null || _a === void 0 ? void 0 : _a.length)) {
        return (react_1.default.createElement("span", null, "selected value not available in options"));
    }
    // wait for doc to be retrieved before rendering the typeahead
    if (fkId && !doc) {
        return (react_1.default.createElement("span", null, "loading..."));
    }
    if (props.readOnly) {
        return (react_1.default.createElement("span", null, displayField(doc)));
    }
    return (react_1.default.createElement(typeahead_1.Typeahead, { innerRef: props.innerRef, value: docObs, source: source, options: options, displayField: displayField, minLength: 0, placeholder: props.placeholder || (0, utils_1.camelCaseToSpaces)(fkCollection.entity.name), afterChange: value => {
            if ((value === null || value === void 0 ? void 0 : value.primaryKey()) !== fkId) {
                setDoc(value);
                setFkId(value === null || value === void 0 ? void 0 : value.primaryKey());
            }
            if (props.afterChange) {
                props.afterChange(value);
            }
        }, dontLoadEmptyString: props.dontLoadEmptyString }));
}
exports.TypeaheadFK = TypeaheadFK;
//# sourceMappingURL=typeahead-fk.js.map