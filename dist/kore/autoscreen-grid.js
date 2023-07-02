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
exports.AutoscreenGrid = exports.DefaultGoTo = void 0;
const knockout_1 = require("knockout");
const react_1 = __importStar(require("react"));
const utils_1 = require("../utils");
const input_1 = require("./input");
const autogrid_1 = require("./autogrid");
const hooks_1 = require("./hooks");
let DefaultGoTo = (path) => {
    throw new Error('You must set `DefaultGoTo` or pass one in via props');
};
exports.DefaultGoTo = DefaultGoTo;
function AutoscreenGrid(props) {
    var _a;
    const changesExist = props.changesExist || (0, react_1.useState)(() => (0, knockout_1.observable)(false))[0];
    const { collection } = props;
    const [data] = (0, react_1.useState)(() => props.data || collection.observables.list());
    const [error, setError] = (0, react_1.useState)('');
    const [deletedDocs, setDeletedDocs] = (0, react_1.useState)([]);
    const [searchText] = (0, react_1.useState)(() => (0, knockout_1.observable)(''));
    (0, hooks_1.useSubscription)(data, (_data) => {
        const onChange = () => {
            changesExist(true);
        };
        const sub = data.subscribe(() => {
            if (data().some(d => d.isNew)) {
                changesExist(true);
            }
        });
        const subs = data().map(d => d.q.subscribe(onChange));
        return () => {
            sub.dispose();
            subs.forEach(s => s.dispose());
        };
    });
    async function saveChanges() {
        try {
            const _data = data().filter(d => d.hasChanges());
            // todo try to make this a batch operation (i.e. if any fail, they all fail)
            if (props.onDelete) {
                await Promise.all(deletedDocs.map(d => props.onDelete(d)));
            }
            else {
                await Promise.all(deletedDocs.map(d => d.delete()));
            }
            if (props.onSave) {
                await Promise.all(_data.map(d => props.onSave(d)));
            }
            else {
                _data.forEach(d => d.validate());
                await Promise.all(_data.map(d => d.save()));
            }
            setError('');
            changesExist(false);
        }
        catch (err) {
            setError(String(err));
        }
    }
    const pluralNamePath = (0, utils_1.camelCaseToHyphens)(collection.entity.namePlural);
    let onGoto = props.onGoto;
    if (onGoto !== false && typeof onGoto !== 'function') {
        onGoto = doc => {
            (0, exports.DefaultGoTo)(`${pluralNamePath}/${doc[collection.primaryKey.name]}`);
        };
    }
    let filterControls = props.filters || [];
    if (filterControls.some(s => typeof s === 'string')) {
        throw new Error('filter controls specified by strings is not yet supported');
    }
    filterControls = filterControls.map(fc => {
        return (react_1.default.createElement("div", { className: "col-3" }, fc));
    });
    if (!props.hideSearch) {
        let offsetCnt = 9 - ((filterControls.length) * 3);
        filterControls.push(react_1.default.createElement("div", { className: `col-3 offset-${offsetCnt}` },
            react_1.default.createElement(input_1.Input, { className: 'form-control', value: searchText, placeholder: "search grid..." })));
    }
    const showDelete = typeof props.showDelete === 'boolean' ? props.showDelete : props.readOnly !== true;
    return (react_1.default.createElement("div", { className: 'container-fluid' },
        react_1.default.createElement("span", { className: 'float-end' },
            !props.readOnly && react_1.default.createElement(SaveButton, { changesExist: changesExist, saveChanges: saveChanges }),
            error && (react_1.default.createElement("span", { className: 'clearfix text-danger text-wrap', style: { width: '100px' } },
                react_1.default.createElement("br", null),
                error))),
        react_1.default.createElement("div", { className: 'fs-2 text-center' }, props.title || (0, utils_1.camelCaseToSpaces)(collection.entity.namePlural)),
        filterControls.length && (react_1.default.createElement("div", { className: "row", style: { paddingBottom: '8px' } }, filterControls.map((c, i) => react_1.default.createElement(react_1.default.Fragment, { key: i }, c)))),
        react_1.default.createElement(autogrid_1.Autogrid, { collection: collection, columns: props.columns, data: data, defaultSort: (_a = props.defaultSort) !== null && _a !== void 0 ? _a : 'id', readOnly: props.readOnly, showSave: false, showDelete: showDelete, onDelete: doc => {
                changesExist(true);
                data.remove(doc);
                setDeletedDocs([...deletedDocs, doc]);
            }, onGoto: onGoto, newRow: props.newRow, searchText: searchText })));
}
exports.AutoscreenGrid = AutoscreenGrid;
const SaveButton = (props) => {
    const { saveChanges, dontFloat } = props;
    const [changesExist] = (0, hooks_1.useObservable)(props.changesExist);
    let style = {};
    if (!dontFloat && changesExist) {
        style = { position: 'absolute', right: '25px' };
    }
    return (react_1.default.createElement("span", { style: Object.assign({}, style) },
        !changesExist && (react_1.default.createElement("button", { className: 'btn btn-outline-secondary', disabled: true }, "Save Changes")),
        changesExist && (react_1.default.createElement("button", { className: 'btn btn-primary', onClick: saveChanges }, "Save Changes"))));
};
//# sourceMappingURL=autoscreen-grid.js.map