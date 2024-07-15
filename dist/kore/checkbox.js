"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checkbox = void 0;
const react_1 = __importDefault(require("react"));
const hooks_1 = require("./hooks");
function Checkbox(props) {
    var _a;
    const [checked, setChecked] = (0, hooks_1.useObservable)(props.checked);
    const type = (_a = props.type) !== null && _a !== void 0 ? _a : 'checkbox';
    function onChange(evt) {
        let _value = evt.target.checked;
        if (type === 'checkbox') {
            _value = !!_value;
        }
        setChecked(_value);
    }
    return (react_1.default.createElement("input", Object.assign({ onChange: onChange, type: type }, props, { checked: checked })));
}
exports.Checkbox = Checkbox;
//# sourceMappingURL=checkbox.js.map