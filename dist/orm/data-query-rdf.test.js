"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_query_rdf_1 = require("./data-query-rdf");
function fmtSql(sql) {
    return sql.split('\n').map(l => l.trim()).filter(s => s).join('\n');
}
describe('rdfEntityToSqlColumns', () => {
    it('should return correct SQL columns for entity', () => {
        const entity = {
            name: 'Person',
            primaryKey: { name: 'id', dataType: 'string' },
            fields: [
                { name: 'id', dataType: 'string' },
                { name: 'name', dataType: 'string' },
                { name: 'age', dataType: 'number' },
            ]
        };
        const sql = (0, data_query_rdf_1.rdfEntityToSqlColumns)(entity);
        expect(sql).toBe(fmtSql(`
      subject as [id],
      MAX(CASE predicate WHEN 'name' THEN value END) as [name],
      MAX(CASE predicate WHEN 'age' THEN value END) as [age]
    `));
    });
    it('should use id as the default column', () => {
        const entity = {
            name: 'Person',
            fields: [
                { name: 'name', dataType: 'string' },
                { name: 'age', dataType: 'number' },
            ]
        };
        const sql = (0, data_query_rdf_1.rdfEntityToSqlColumns)(entity);
        expect(sql).toBe(fmtSql(`
      subject as [id],
      MAX(CASE predicate WHEN 'name' THEN value END) as [name],
      MAX(CASE predicate WHEN 'age' THEN value END) as [age]
    `));
    });
    it('should allow id to be in the fields list and there be no primary key', () => {
        const entity = {
            name: 'Person',
            fields: [
                { name: 'id', dataType: 'string' },
                { name: 'name', dataType: 'string' },
                { name: 'age', dataType: 'number' },
            ]
        };
        const sql = (0, data_query_rdf_1.rdfEntityToSqlColumns)(entity);
        expect(sql).toBe(fmtSql(`
      subject as [id],
      MAX(CASE predicate WHEN 'name' THEN value END) as [name],
      MAX(CASE predicate WHEN 'age' THEN value END) as [age]
    `));
    });
});
describe.skip('dataFilterToRdfQuery', () => {
});
//# sourceMappingURL=data-query-rdf.test.js.map