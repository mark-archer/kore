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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyList = void 0;
const react_1 = __importStar(require("react"));
const react_infinite_scroll_component_1 = __importDefault(require("react-infinite-scroll-component"));
const hooks_1 = require("./hooks");
const knockout_1 = require("knockout");
function LazyList(props) {
    var _a, _b;
    const [itemsObsAry] = (0, react_1.useState)(() => (0, knockout_1.observableArray)([]));
    const [items] = (0, hooks_1.useObservable)(itemsObsAry);
    const [allLoaded, setAllLoaded] = (0, react_1.useState)(false);
    const [loading] = (0, react_1.useState)(() => (0, knockout_1.observable)(false));
    (0, hooks_1.useObservable)(loading);
    async function loadMore() {
        if (loading()) {
            // console.log('loading called while prior load still in progress')
            return;
        }
        loading(true);
        const moreItems = await props.loadMore(items);
        if (!moreItems.length) {
            console.log('all items loaded');
            setAllLoaded(true);
        }
        else {
            itemsObsAry.push(...moreItems);
        }
        loading(false);
    }
    let renderItems = items;
    if (props.filterItems) {
        renderItems = props.filterItems(items);
    }
    if (renderItems.length < 50 && !allLoaded) {
        loadMore();
    }
    // console.log('existing tasks', items.length);
    // console.log('rendering tasks', renderItems.length);
    return (react_1.default.createElement("div", { id: "scrollableDiv", style: props.lazyListStyle },
        react_1.default.createElement(react_infinite_scroll_component_1.default, { dataLength: renderItems.length, next: loadMore, hasMore: !allLoaded, scrollThreshold: props.scrollThreshold, loader: (_a = props.loadingIndicator) !== null && _a !== void 0 ? _a : react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "d-flex justify-content-center" },
                    react_1.default.createElement("div", null, "loading..."))), endMessage: (_b = props.endOfList) !== null && _b !== void 0 ? _b : react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "d-flex justify-content-center" },
                    react_1.default.createElement("i", null, "end of list"))) }, props.renderItems(renderItems))));
}
exports.LazyList = LazyList;
//# sourceMappingURL=lazy-list.js.map