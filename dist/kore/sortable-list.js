"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortableList = void 0;
const react_1 = __importDefault(require("react"));
const knockout_1 = require("knockout");
const sortablejs_1 = __importDefault(require("sortablejs"));
const lodash_1 = require("lodash");
class SortableList extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.listId = `${Date.now()}_${Math.round(Math.random() * 100000)}`;
        this.sortHandle = `.sort-handle-${this.listId}`;
        this.sortHandle = this.props.dragHandleClassName && `.${this.props.dragHandleClassName}` || this.sortHandle;
    }
    calculateSortOrder(index) {
        var _a, _b;
        const items = this.items;
        if (index === 0)
            return Date.now();
        if (index >= items.length)
            return (0, lodash_1.last)(items).sortOrder - 10000;
        const above = (_a = items[index - 1].sortOrder) !== null && _a !== void 0 ? _a : Date.now();
        const below = (_b = items[index].sortOrder) !== null && _b !== void 0 ? _b : Number.MIN_VALUE;
        if (above === below)
            alert('sort order has converged to the same number in this area.  Try moving items to the top or bottom of the list to fix it');
        return above - ((above - below) / 2);
    }
    componentDidMount() {
        const self = this;
        const listDiv = document.getElementById(this.listId);
        sortablejs_1.default.create(listDiv, {
            handle: this.sortHandle,
            group: { name: this.props.listsGroup || this.listId, put: !!this.props.onAdd },
            animation: 100,
            onUpdate: evt => {
                const items = self.items;
                const item = items.splice(evt.oldIndex, 1)[0];
                item.sortOrder = this.calculateSortOrder(evt.newIndex);
                items.splice(evt.newIndex, 0, item);
                // console.log(items.map(i => i.toJS()));
                if (this.props.onUpdate) {
                    this.props.onUpdate({ items, ixMoved: [evt.newIndex] });
                }
            },
            onAdd: evt => {
                const itemEl = evt.item; // dragged HTMLElement
                if (evt.to !== evt.from) {
                    // first restore html hierarchy so html doesn't get out of sync with react
                    evt.to.removeChild(itemEl);
                    evt.from.appendChild(itemEl);
                    // now if we were given an `onAdd` function, call it
                    if (this.props.onAdd) {
                        const itemId = evt.item.id;
                        this.props.onAdd(itemId, this.calculateSortOrder(evt.newIndex));
                    }
                }
            },
        });
    }
    render() {
        var _a, _b;
        let items = (0, knockout_1.unwrap)(this.props.items);
        if (this.props.sortDirection === 'asc') {
            items = (0, lodash_1.sortBy)(items, i => { var _a; return (_a = i.sortOrder) !== null && _a !== void 0 ? _a : -Infinity; });
        }
        else {
            items = (0, lodash_1.sortBy)(items, i => { var _a; return (_a = -i.sortOrder) !== null && _a !== void 0 ? _a : Infinity; });
        }
        this.items = items;
        return (react_1.default.createElement("div", Object.assign({ id: this.listId, style: { minHeight: (_a = this.props.minHeight) !== null && _a !== void 0 ? _a : "25px", paddingBottom: (_b = this.props.paddingBottom) !== null && _b !== void 0 ? _b : "10px" } }, this.props.containerProps), items.map(item => this.props.renderItem({ item, listId: this.listId, sortHandle: this.sortHandle.substring(1) }))));
    }
}
exports.SortableList = SortableList;
//# sourceMappingURL=sortable-list.js.map