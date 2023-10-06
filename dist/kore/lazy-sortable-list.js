"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazySortableList = void 0;
const react_1 = __importDefault(require("react"));
const lazy_list_1 = require("./lazy-list");
const sortable_list_1 = require("./sortable-list");
function LazySortableList(props) {
    return (react_1.default.createElement(lazy_list_1.LazyList, { lazyListStyle: props.lazyListStyle, loadMore: props.loadMore, filterItems: props.filterItems, endOfList: props.endOfList, loadingIndicator: props.loadingIndicator, scrollThreshold: props.scrollThreshold, renderItems: items => (react_1.default.createElement(sortable_list_1.SortableList, { items: items, sortDirection: props.sortDirection, renderItem: props.renderItem, listsGroup: props.listsGroup, onAdd: props.onAdd, onUpdate: props.onUpdate, hidden: props.hidden, containerProps: props.containerProps, dragHandleClassName: props.dragHandleClassName, minHeight: props.minHeight, paddingBottom: props.paddingBottom })) }));
}
exports.LazySortableList = LazySortableList;
//# sourceMappingURL=lazy-sortable-list.js.map