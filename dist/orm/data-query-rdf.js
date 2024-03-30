"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataFilterToSqlTextSearch = exports.dataFilterToSqlWhere = exports.dataQueryToRdfQuery = exports.rdfEntityToSqlColumns = void 0;
const lodash_1 = require("lodash");
function rdfEntityToSqlColumns(entity) {
    var _a;
    let sqlColumns = `subject as [${((_a = entity.primaryKey) === null || _a === void 0 ? void 0 : _a.name) || 'id'}]`;
    const addCols = entity.fields
        .filter(f => { var _a; return f.name !== (((_a = entity.primaryKey) === null || _a === void 0 ? void 0 : _a.name) || 'id'); })
        .map(f => {
        // TODO escape quotes in names
        return `MAX(CASE predicate WHEN '${f.name}' THEN value END) as [${f.name}]`;
    });
    return [
        sqlColumns,
        ...addCols
    ].join(',\n');
}
exports.rdfEntityToSqlColumns = rdfEntityToSqlColumns;
function dataQueryToRdfQuery(entity, dataQuery) {
    var _a;
    let orderBy = "1";
    if (dataQuery.sortBy().length) {
        const sortBys = dataQuery.sortBy().map(s => String(s));
        orderBy = sortBys.map(s => {
            if (s.startsWith('-')) {
                return `[${s.substr(1)}] DESC`;
            }
            else {
                return `[${s}] ASC`;
            }
        }).join(', ');
    }
    let where = dataFilterToSqlWhere(dataQuery.filter());
    if (dataQuery.textSearch()) {
        const textSearch = dataFilterToSqlTextSearch(dataQuery);
        if (where !== '(1=1)') {
            where = `(${where}) AND (${textSearch})`;
        }
        else {
            where = textSearch;
        }
    }
    let sql = `
    SELECT 
      * 
    FROM [${((_a = dataQuery.collection.entity) === null || _a === void 0 ? void 0 : _a.namePlural) || dataQuery.collection.entityName}]
    WHERE ${where || '1=1'}
    ORDER BY ${orderBy}
    OFFSET ${dataQuery.pageSize() * (dataQuery.page() - 1)} ROWS
    FETCH ${dataQuery.pageSize()} ROWS
  `
        .trim()
        .replace(/    /g, '');
    return sql;
}
exports.dataQueryToRdfQuery = dataQueryToRdfQuery;
function dataFilterToSqlWhere(filter) {
    if ((0, lodash_1.isArray)(filter)) {
        const orStatement = filter.map(f => dataFilterToSqlWhere(f)).join(' OR ');
        return `(${orStatement})`;
    }
    const fieldNames = Object.keys(filter).filter(name => !name.startsWith('$'));
    if (!fieldNames.length) {
        return '(1=1)';
    }
    const strFilter = fieldNames.map(name => {
        let value = filter[name];
        if (value === undefined || value === null) {
            return `[${name}] IS NULL`;
        }
        let operator = '=';
        if ((0, lodash_1.isArray)(value)) {
            operator = 'IN';
        }
        if (value.$nin) {
            operator = "NOT IN";
            value = value.$nin;
        }
        else if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 1 && keys[0].startsWith('$')) {
                const key = keys[0];
                value = value[key];
                if (key === '$exists') {
                    if (value) {
                        operator = "IS NOT";
                    }
                    else {
                        operator = "IS";
                    }
                    value = null;
                }
                else {
                    operator = key === '$ne' ? '<>' :
                        key === '$gt' ? '>' :
                            key === '$gte' ? '>=' :
                                key === '$lt' ? '<' :
                                    key === '$lte' ? '<=' :
                                        null;
                    if (operator === null) {
                        throw new Error(`unknown operator: ${key}`);
                    }
                }
            }
        }
        let strValue = dataFieldScalarToSqlValue(value);
        return `[${name}] ${operator} ${strValue}`;
    }).join(' AND ');
    return `(${strFilter})`;
}
exports.dataFilterToSqlWhere = dataFilterToSqlWhere;
function dataFieldScalarToSqlValue(value) {
    if ((0, lodash_1.isArray)(value)) {
        return `(${value.map(v => `${dataFieldScalarToSqlValue(v)}`).join(', ')})`;
    }
    if (value === undefined || value === null) {
        return 'NULL';
    }
    else if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }
    else if (typeof value === 'number') {
        return String(value);
    }
    else if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
    }
    else if (value instanceof Date) {
        return `'${value.toISOString()}'`;
    }
    else {
        throw new Error(`unknown data field type: ${value}`);
    }
}
function dataFilterToSqlTextSearch(query) {
    const textSearch = query.textSearch();
    if (!textSearch) {
        return '';
    }
    const fieldNames = query.collection.fields.map(f => f.name);
    const strFilter = fieldNames.map(name => {
        return `[${name}] LIKE '%${textSearch.replace(/'/g, "''")}%'`;
    }).join(' OR ');
    return `(${strFilter})`;
}
exports.dataFilterToSqlTextSearch = dataFilterToSqlTextSearch;
//# sourceMappingURL=data-query-rdf.js.map