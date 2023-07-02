"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDoc = void 0;
const knockout_1 = require("knockout");
// TODO changing this to a class would probably be a significant performance boost
//			because each one of those functions would only be instantiated once instead of for every doc
//			NOTE: I gave this a shot and found out indexing fields is clear cut and the `this` binding becomes a problem
function newDoc(collection, data = {}) {
    const columns = [collection.primaryKey, ...collection.fields];
    // @ts-ignore
    const doc = {
        isNew: true,
        collection,
        q: (0, knockout_1.observable)(0),
        qs: {},
        load: async (objOrId) => {
            if (typeof objOrId !== 'object') {
                const id = objOrId || doc[collection.primaryKey.name];
                if (!id) {
                    return doc;
                }
                objOrId = await collection.get(id);
                if (!objOrId) {
                    throw new Error(`Could not find doc for ${collection.entityName}:${id}`);
                }
                doc.isNew = false;
                doc.q(0);
            }
            for (const col of columns) {
                if (objOrId[col.name] !== undefined) {
                    // @ts-ignore
                    doc[col.name] = objOrId[col.name];
                }
            }
            return doc;
        },
        toJS: () => {
            const _data = Object.assign({}, data);
            columns.forEach(col => {
                const value = doc[col.name];
                if (typeof value !== 'function') {
                    _data[col.name] = value;
                }
            });
            return _data;
        },
        save: async () => {
            const data = doc.validate();
            const src = await collection.save(data);
            return doc.load(src).then(() => {
                doc.isNew = false;
                doc.q(0);
            });
        },
        delete: async () => {
            await collection.remove(doc[collection.primaryKey.name]);
            return doc;
        },
        validationError: (0, knockout_1.observable)(null),
        validate: () => {
            try {
                const data = doc.toJS();
                collection.validate(data);
                doc.validationError(null);
                return data;
            }
            catch (err) {
                doc.validationError(err);
                throw err;
            }
        },
        displayValue: () => {
            var _a;
            let displayValue = collection.entity.displayValue;
            if (!displayValue) {
                displayValue = (_a = collection.fields.find(c => c.dataType === 'string')) === null || _a === void 0 ? void 0 : _a.name;
            }
            if (typeof displayValue === 'function') {
                return displayValue(doc);
            }
            else if (displayValue) {
                return doc[displayValue];
            }
            else {
                return doc[collection.primaryKey.name];
            }
        },
        primaryKey: () => doc[collection.primaryKey.name],
        hasChanges: () => doc.isNew || doc.q() !== 0,
    };
    columns.forEach(col => {
        const fieldQ = (0, knockout_1.observable)(data[col.name]);
        fieldQ.subscribe(() => doc.q(doc.q() + 1));
        // @ts-ignore
        doc.qs[col.name] = fieldQ;
        Object.defineProperty(doc, col.name, {
            get: () => fieldQ(),
            set: value => fieldQ(value)
        });
    });
    return doc;
}
exports.newDoc = newDoc;
//@ts-ignore
if (typeof window !== 'undefined')
    window.newDoc = newDoc;
//# sourceMappingURL=doc.js.map