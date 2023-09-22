"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDoc = void 0;
const knockout_1 = require("knockout");
const collection_1 = require("./collection");
const lodash_1 = require("lodash");
// TODO changing this to a class would probably be a significant performance boost
//			because each one of those functions would only be instantiated once instead of for every doc
//			NOTE: I gave this a shot and found out indexing fields is clear cut and the `this` binding becomes a problem
function newDoc(data = {}, collection) {
    if (!collection) {
        const fields = Object.keys(data).map(name => {
            const dataType = typeof data[name];
            if (dataType === 'bigint' || dataType === 'function' || dataType === 'object' || dataType === 'symbol' || dataType === 'undefined') {
                throw new Error(`Unsupported type for field: ${name}: ${dataType}`);
            }
            return {
                name,
                dataType,
            };
        });
        collection = new collection_1.Collection({
            name: 'AnonymousType',
            fields,
        }, null, null);
    }
    const columns = [collection.primaryKey, ...collection.fields];
    // @ts-ignore
    const doc = {
        isNew: true,
        collection,
        q: (0, knockout_1.observable)(0),
        qs: {},
        load: async (objOrId) => {
            let loadedFromDb = false;
            if (typeof objOrId !== 'object') {
                const id = objOrId || doc[collection.primaryKey.name];
                if (!id) {
                    return doc;
                }
                objOrId = await collection.get(id);
                if (!objOrId) {
                    throw new Error(`Could not find doc for ${collection.entityName}:${id}`);
                }
                loadedFromDb = true;
            }
            const fieldNames = Object.keys(objOrId);
            for (const fieldName of fieldNames) {
                if (objOrId[fieldName] !== undefined) {
                    // note that this won't create new observables for fields that weren't in the original data
                    doc[fieldName] = objOrId[fieldName];
                    data[fieldName] = objOrId[fieldName];
                }
            }
            if (loadedFromDb) {
                doc.isNew = false;
                doc.q(0);
            }
            return doc;
        },
        toJS: () => {
            const _data = (0, lodash_1.cloneDeep)(data);
            return _data;
        },
        validationError: (0, knockout_1.observable)(null),
        validate: () => {
            try {
                const _data = doc.toJS();
                collection.validate(_data);
                doc.validationError(null);
                return _data;
            }
            catch (err) {
                doc.validationError(err);
                throw err;
            }
        },
        save: async () => {
            let _data = doc.validate();
            const src = await collection.save(_data);
            return doc.load(src).then(() => {
                doc.isNew = false;
                doc.q(0);
            });
        },
        delete: async () => {
            await collection.remove(doc[collection.primaryKey.name]);
            return doc;
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
    const fieldNames = (0, lodash_1.uniq)([...columns.map(c => c.name), ...Object.keys(data)]);
    fieldNames.forEach(fieldName => {
        const fieldQ = (0, knockout_1.observable)(data[fieldName]);
        fieldQ.subscribe(() => {
            data[fieldName] = fieldQ();
            doc.q(doc.q() + 1);
        });
        doc.qs[fieldName] = fieldQ;
        Object.defineProperty(doc, fieldName, {
            get: () => fieldQ(),
            set: value => {
                fieldQ(value);
                // data[fieldName] = value;
            }
        });
    });
    return doc;
}
exports.newDoc = newDoc;
//@ts-ignore
if (typeof window !== 'undefined')
    window.newDoc = newDoc;
//# sourceMappingURL=doc.js.map