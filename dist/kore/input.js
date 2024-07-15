"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const react_1 = __importDefault(require("react"));
const hooks_1 = require("./hooks");
function Input(props) {
    var _a;
    const [value, setValue] = (0, hooks_1.useObservable)(props.value);
    const type = (_a = props.type) !== null && _a !== void 0 ? _a : (typeof value);
    function onChange(evt) {
        let _value = evt.target.value;
        if (type === 'number') {
            _value = Number(_value);
        }
        setValue(_value);
    }
    return (react_1.default.createElement("input", Object.assign({ onChange: onChange, type: type }, props, { value: value })));
}
exports.Input = Input;
//# sourceMappingURL=input.js.map