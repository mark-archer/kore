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
exports.TypeaheadFK = exports.fkValueCacheTTL = exports.supportTables = void 0;
const react_1 = __importStar(require("react"));
const typeahead_1 = require("./typeahead");
const knockout_1 = require("knockout");
const hooks_1 = require("./hooks");
const utils_1 = require("../utils");
const supportTableEntries = {};
exports.supportTables = []; //[GLAccountTypes, GLBalanceTypes];
const fkColumnValueCache = {};
const fkValueCache = {};
exports.fkValueCacheTTL = 1000;
function getFkValue(fkCollection, fkId) {
    const cacheId = `${fkCollection.entityName}-${fkId}`;
    let pValue = fkValueCache[cacheId];
    if (!pValue) {
        pValue = fkCollection.get(fkId);
        fkValueCache[cacheId] = pValue;
        setTimeout(() => delete fkValueCache[cacheId], exports.fkValueCacheTTL);
    }
    return pValue;
}
function TypeaheadFK(props) {
    var _a, _b;
    const { fkCollection } = props;
    const [fkId, setFkId] = (0, hooks_1.useObservable)(props.fkId);
    const [docObs] = (0, react_1.useState)(() => (0, knockout_1.observable)());
    const [doc, setDoc] = (0, hooks_1.useObservable)(docObs);
    let source = props.source || fkCollection.search;
    let options = props.options;
    const supportTable = exports.supportTables.find(st => st.entityName === fkCollection.entityName);
    if (!options && supportTable) {
        if (!supportTableEntries[fkCollection.entityName]) {
            supportTableEntries[fkCollection.entityName] = fkCollection.observables.list();
        }
        options = supportTableEntries[fkCollection.entityName];
        source = undefined;
    }
    (0, hooks_1.useObservable)(options);
    // look up doc with fkId
    (0, react_1.useEffect)(() => {
        if ((doc === null || doc === void 0 ? void 0 : doc.primaryKey()) === fkId)
            return;
        if (options) {
            // get doc from list of support table entries, if support table entries are loaded, wait for load
            const _doc = options().find(i => i.primaryKey() === fkId);
            setDoc(_doc);
        }
        else {
            getFkValue(fkCollection, fkId).then(setDoc);
        }
    }, [
        fkId,
        ((_a = options === null || options === void 0 ? void 0 : options()) === null || _a === void 0 ? void 0 : _a.map(o => o.primaryKey()).join(',')) || ''
    ]);
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
    if (fkId && !doc && ((_b = options === null || options === void 0 ? void 0 : options()) === null || _b === void 0 ? void 0 : _b.length)) {
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