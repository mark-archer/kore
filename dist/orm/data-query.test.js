"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_query_1 = require("./data-query");
const factory_1 = require("./factory");
describe('dataFilterToSqlWhere', () => {
    it('should return "1=1" when filter is empty', () => {
        const filter = {};
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe('(1=1)');
    });
    it('should return correct SQL WHERE clause for single field filter', () => {
        const filter = { name: 'John' };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([name] = 'John')");
    });
    it('should return correct SQL WHERE clause for multiple field filter', () => {
        const filter = { name: 'John', age: 30 };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([name] = 'John' AND [age] = 30)");
    });
    it('should return correct SQL WHERE clause for array filter', () => {
        const filter = { name: ['John', 'Jane'] };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([name] IN ('John', 'Jane'))");
    });
    it('should handle null and undefined values correctly', () => {
        const filter = { name: null, age: undefined };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([name] IS NULL AND [age] IS NULL)");
    });
    it('should escape single quotes in strings', () => {
        const filter = { name: "John's" };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([name] = 'John''s')");
    });
    it('should convert top level arrays into OR statements', () => {
        const filter = [
            { name: 'John' },
            { age: 32 },
        ];
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("(([name] = 'John') OR ([age] = 32))");
    });
    it('should convert top level arrays into OR statements of AND statements', () => {
        const filter = [
            { name: 'John' },
            { age: 32, airport: ['LAX', 'PSP'] },
        ];
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("(([name] = 'John') OR ([age] = 32 AND [airport] IN ('LAX', 'PSP')))");
    });
    it('should convert $nin to NOT IN', () => {
        const filter = { age: { $nin: [29, 'lol'] } };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([age] NOT IN (29, 'lol'))");
    });
    it('should convert $gte to ">="', () => {
        const filter = { age: { $gte: 12 } };
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("([age] >= 12)");
    });
    it('should convert $gt to >', () => {
        const filter = [{ age: { $gt: 12 } }];
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("(([age] > 12))");
    });
    it('should convert $exists to IS or IS NOT NULL', () => {
        const filter = [
            { age: { $exists: true } },
            { age: { $exists: false } },
        ];
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("(([age] IS NOT NULL) OR ([age] IS NULL))");
    });
    it('should convert $lt, $lte, $ne correctly', () => {
        const filter = [
            { age: { $lt: 10 } },
            { age: { $lte: 10 } },
            { age: { $ne: 10 } },
        ];
        const result = (0, data_query_1.dataFilterToSqlWhere)(filter);
        expect(result).toBe("(([age] < 10) OR ([age] <= 10) OR ([age] <> 10))");
    });
});
const aryCollection = (0, factory_1.arrayAsCollection)([
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 32 },
    { id: 3, name: 'Joe', age: 29 },
    { id: 4, name: 'Jeb', age: 50 },
    { id: 5, name: 'Joey', age: 31 },
], {
    name: 'Person',
    namePlural: 'People'
});
describe('DataQuery', () => {
    describe('cursor', () => {
        const query = aryCollection.query();
        query.pageSize(2);
        it('should allow async iteration via `for await`', async () => {
            var _a, e_1, _b, _c;
            let results = [];
            try {
                for (var _d = true, _e = __asyncValues(query.cursor()), _f; _f = await _e.next(), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const item = _c;
                        results.push(item.id);
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            expect(results).toEqual([1, 2, 3, 4, 5]);
        });
        it('should allow async iteration via `while await next`', async () => {
            let results = [];
            const cursor = query.cursor();
            while (await cursor.next()) {
                results.push(cursor.value.id);
            }
            expect(results).toEqual([1, 2, 3, 4, 5]);
        });
    });
});
describe('dataQueryToSqlQuery', () => {
    const aryCollection = (0, factory_1.arrayAsCollection)([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 32 },
        { id: 3, name: 'Joe', age: 29 },
    ], {
        name: 'Person',
        namePlural: 'People'
    });
    function fmtSql(sql) {
        return sql.replace(/      /g, '').trim();
    }
    const query = new data_query_1.DataQuery(aryCollection, async (query) => aryCollection.list());
    it('should return correct SQL query for empty query', () => {
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE (1=1)
      ORDER BY 1
      OFFSET 0 ROWS
      FETCH 30 ROWS
    `));
    });
    it('should generate single clause for single field filter', () => {
        query.filter({ age: 30 });
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE ([age] = 30)
      ORDER BY 1
      OFFSET 0 ROWS
      FETCH 30 ROWS
    `));
    });
    it('should generate AND clause for multie field filter', () => {
        query.filter({ age: 30, name: 'John' });
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE ([age] = 30 AND [name] = 'John')
      ORDER BY 1
      OFFSET 0 ROWS
      FETCH 30 ROWS
    `));
    });
    it('should generate OR LIKE clauses for all fields for text search', () => {
        query.filter({});
        query.textSearch('John');
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE ([id] LIKE '%John%' OR [name] LIKE '%John%' OR [age] LIKE '%John%')
      ORDER BY 1
      OFFSET 0 ROWS
      FETCH 30 ROWS
    `));
    });
    it('should combine filter and textSearch with AND', () => {
        query.filter({ age: 30 });
        query.textSearch('John');
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE (([age] = 30)) AND (([id] LIKE '%John%' OR [name] LIKE '%John%' OR [age] LIKE '%John%'))
      ORDER BY 1
      OFFSET 0 ROWS
      FETCH 30 ROWS
    `));
    });
    it('should respond correctly to pageSize changing', () => {
        query.filter({});
        query.textSearch('');
        query.pageSize(10);
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE (1=1)
      ORDER BY 1
      OFFSET 0 ROWS
      FETCH 10 ROWS
    `));
    });
    it('should respond calculate OFFSET and FETCH from page and pageSize', () => {
        query.filter({});
        query.textSearch('');
        query.pageSize(10);
        query.page(10);
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE (1=1)
      ORDER BY 1
      OFFSET 90 ROWS
      FETCH 10 ROWS
    `));
    });
    it('should respond calculate OFFSET and FETCH from page and pageSize', () => {
        query.filter({});
        query.textSearch('');
        query.pageSize(10);
        query.page(10);
        query.sortBy(['name', '-age']);
        let sql = (0, data_query_1.dataQueryToSqlQuery)(query);
        expect(sql).toBe(fmtSql(`
      SELECT 
        * 
      FROM [People]
      WHERE (1=1)
      ORDER BY [name] ASC, [age] DESC
      OFFSET 90 ROWS
      FETCH 10 ROWS
    `));
    });
});
//# sourceMappingURL=data-query.test.js.map