"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Typeahead = void 0;
const react_1 = __importDefault(require("react"));
const hooks_1 = require("./hooks");
const react_select_1 = __importDefault(require("react-select"));
const async_1 = __importDefault(require("react-select/async"));
const lodash_1 = __importDefault(require("lodash"));
const optionsCache = new Map();
function Typeahead(props) {
    const [value, setValue] = (0, hooks_1.useObservable)(props.value);
    const [options] = (0, hooks_1.useObservable)(props.options);
    let { displayField } = props;
    if (!displayField) {
        displayField = 'display';
    }
    let getLabel;
    if (typeof displayField === 'function') {
        getLabel = displayField;
    }
    else {
        getLabel = (x) => x[displayField];
    }
    const promiseOptions = (query) => {
        var _a;
        const sortFields = ['sortOrder', 'name', 'id', 'Id'];
        if (!query) {
            let cache = optionsCache.get(props.source);
            if (!cache) {
                cache = props.source(query).then(results => {
                    if (props.dontSortSourceResults) {
                        return results;
                    }
                    return lodash_1.default.sortBy(results, ...sortFields);
                });
                optionsCache.set(props.source, cache);
            }
            return cache;
        }
        return (_a = props.source) === null || _a === void 0 ? void 0 : _a.call(props, query).then(results => {
            if (props.dontSortSourceResults) {
                return results;
            }
            return lodash_1.default.sortBy(results, ...sortFields);
        });
    };
    function getOptionValue(x) {
        // @ts-ignore
        return x.id || x.Id || x._id;
    }
    function onChange(selection) {
        if (selection.length <= 1) {
            setValue(selection[0]);
        }
        else {
            throw new Error('multi-select not currently supported');
        }
        if (props.afterChange) {
            props.afterChange(selection[0]);
        }
    }
    if (options) {
        return (react_1.default.createElement(react_select_1.default, { ref: props.innerRef, value: value, options: options, getOptionLabel: getLabel, getOptionValue: getOptionValue, isClearable: true, onChange: evt => onChange([evt]), placeholder: props.placeholder }));
    }
    return (react_1.default.createElement(async_1.default, { ref: props.innerRef, cacheOptions: true, defaultOptions: !props.dontLoadEmptyString, value: value, loadOptions: promiseOptions, getOptionLabel: getLabel, getOptionValue: getOptionValue, isClearable: true, onChange: evt => onChange([evt]), placeholder: props.placeholder }));
}
exports.Typeahead = Typeahead;
//# sourceMappingURL=typeahead.js.map