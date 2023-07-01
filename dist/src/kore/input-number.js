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
exports.InputNumber = void 0;
const knockout_1 = require("knockout");
const lodash_1 = __importStar(require("lodash"));
const react_1 = __importStar(require("react"));
const utils_1 = require("../utils");
const kore_hooks_1 = require("../kore/kore-hooks");
function InputNumber(props) {
    let { format, precision, refPassthrough } = props;
    if (!lodash_1.default.isNumber(precision)) {
        precision = 2;
    }
    let propsPassthrough = Object.assign({}, props);
    ['value', 'format', 'precision', 'refPassthrough'].forEach(name => (delete propsPassthrough[name]));
    const [value, setValue] = (0, kore_hooks_1.useObservable)(props.value);
    let [displayValue, setDisplayValue] = (0, react_1.useState)(() => {
        if (isNaN(Number(value)) || value === null || String(value).trim() === '') {
            return '';
        }
        if (format === 'money') {
            return (0, utils_1.formatMoney)(Number((0, knockout_1.unwrap)(props.value)), precision);
        }
        return String(value);
    });
    function onChange(evt) {
        let _value = evt.target.value;
        setDisplayValue(_value);
        // convert blank to null
        if (String(_value).trim() === '') {
            setValue(null);
            return;
        }
        _value = _value.replace(/\$/g, '');
        _value = Number(_value);
        if ((0, lodash_1.isNumber)(_value) && !isNaN(_value)) {
            setValue(_value);
        }
    }
    function onBlur(evt) {
        if (format === 'money' && !isNaN(Number(value)) && value !== null && String(value).trim() !== '') {
            const fmtMoney = (0, utils_1.formatMoney)(value, precision);
            setDisplayValue(fmtMoney);
        }
        else if (value === null) {
            setDisplayValue('');
        }
        else {
            setDisplayValue(String(value));
        }
        // todo if not money format precision and set display
    }
    return (react_1.default.createElement("input", Object.assign({}, propsPassthrough, { ref: refPassthrough, value: displayValue, onChange: onChange, onBlur: onBlur })));
}
exports.InputNumber = InputNumber;
//# sourceMappingURL=input-number.js.map