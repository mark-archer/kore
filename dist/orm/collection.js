"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = exports.collections = void 0;
const knockout_1 = require("knockout");
const doc_1 = require("./doc");
const utils_1 = require("../utils");
const factory_1 = require("./factory");
const data_query_1 = require("./data-query");
exports.collections = [];
class Collection {
    constructor(entity, validate, dataSource, primaryKey) {
        var _a, _b;
        this.entity = entity;
        this.validate = validate;
        this.dataSource = dataSource;
        this.observables = {
            get: (id) => {
                const d = this.init({ id });
                const o = (0, knockout_1.observable)(d);
                d.load().then(() => o.notifySubscribers(d));
                return o;
            },
            list: (match, limit, lastModified, group, direction) => {
                const obsAry = (0, knockout_1.observableArray)([]);
                this.list(match, limit, lastModified, group, direction).then(results => obsAry(results));
                return obsAry;
            },
            search: (text, limit, lastModified, group, direction) => {
                const obsAry = (0, knockout_1.observableArray)([]);
                this.search(text, limit, lastModified, group, direction).then(results => obsAry(results));
                return obsAry;
            }
        };
        exports.collections.push(this);
        this.entityName = entity.name;
        let _entity = entity;
        this.fields = [];
        // load all fields, including from extended (parent) entities 
        while (_entity) {
            this.fields = [...this.fields, ..._entity.fields];
            if (!primaryKey) {
                primaryKey = _entity.primaryKey;
            }
            _entity = _entity.extends;
        }
        this.primaryKey = primaryKey !== null && primaryKey !== void 0 ? primaryKey : factory_1.config.defaultPrimaryKey;
        // set fkCollection for any fkFields that reference this collection
        for (const collection of exports.collections) {
            for (const field of collection.fields) {
                if (((_a = field.fkType) === null || _a === void 0 ? void 0 : _a.name) === this.entityName) {
                    field.fkCollection = this;
                }
            }
        }
        // try to set fkCollection for any of this collections fkFields
        for (const field of this.fields) {
            if (field.fkType && !field.fkCollection) {
                for (const collection of exports.collections) {
                    if (((_b = field.fkType) === null || _b === void 0 ? void 0 : _b.name) === collection.entityName) {
                        field.fkCollection = collection;
                    }
                }
            }
        }
        // for (const column of this.fields) {
        // 	if (column.fkType) {
        // 		column.fkCollection = collections.find(c => c.entity.name === column.fkCollection.entityName)
        // 		// column.fkCollection = require('./orm-types')[column.fkType.namePlural];
        // 	}
        // }
        this.init = this.init.bind(this);
        this.get = this.get.bind(this);
        this.list = this.list.bind(this);
        this.search = this.search.bind(this);
        this.save = this.save.bind(this);
        this.remove = this.remove.bind(this);
    }
    init(_data = {}) {
        const data = _data;
        if (!data.type) {
            data.type = this.entity.id || this.entityName;
        }
        let isNew = !Boolean(data[this.primaryKey.name]);
        // set default values
        [...this.fields, this.primaryKey].forEach(c => {
            if (data[c.name] === undefined && c.defaultValue !== undefined) {
                if (typeof c.defaultValue === 'function') {
                    // @ts-ignore
                    data[c.name] = c.defaultValue();
                }
                else {
                    // @ts-ignore
                    data[c.name] = c.defaultValue;
                }
            }
        });
        const doc = (0, doc_1.newDoc)(data, this);
        doc.isNew = isNew;
        return doc;
    }
    async get(id) {
        if (!id) {
            return null;
        }
        // const db = await getDB();
        // const doc = await db.get(id);
        const doc = await this.dataSource.get(id);
        if (doc) {
            return this.init(doc);
        }
        else {
            return null;
        }
    }
    async list(match, limit, lastModified, group, direction = 'next') {
        console.log('list', { type: this.entityName, match, limit, lastModified }); // leave this so queries are very visible 
        const cursor = await this.dataSource.list(lastModified, group, direction);
        const results = [];
        while (await cursor.next()) {
            const value = cursor.value;
            if (typeof match === 'function') {
                if (!(await match(value))) {
                    continue;
                }
            }
            else if (match && !(0, utils_1.objectMatch)(value, match)) {
                continue;
            }
            results.push(cursor.value);
            if (limit && results.length >= limit) {
                break;
            }
        }
        return results.map(r => this.init(r));
    }
    // automatically searches all columns for containing text
    async search(text, limit, lastModified, group, direction) {
        function matchAnyText(doc) {
            if (JSON.stringify(doc).toLowerCase().includes(text)) {
                return true;
            }
            return false;
        }
        return this.list(matchAnyText, limit, lastModified, group, direction);
    }
    query(filter) {
        return new data_query_1.DataQuery(this, async (query) => this.dataSource.query(query), filter);
    }
    async save(_entity) {
        return this.dataSource.save(_entity);
    }
    async remove(entity) {
        if (typeof entity === 'string') {
            entity = await this.dataSource.get(entity);
            if (!entity) {
                return true;
            }
        }
        await this.dataSource.remove(entity);
        return true;
    }
}
exports.Collection = Collection;
//# sourceMappingURL=collection.js.map