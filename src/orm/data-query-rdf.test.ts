import { IEntity } from "./collection";
import { rdfEntityToSqlColumns } from "./data-query-rdf";

function fmtSql(sql: string) {
  return sql.split('\n').map(l => l.trim()).filter(s => s).join('\n');
}

describe('rdfEntityToSqlColumns', () => {
  it('should return correct SQL columns for entity', () => {
    const entity: IEntity = {
      name: 'Person',
      primaryKey: { name: 'id', dataType: 'string' },
      fields: [
        { name: 'id', dataType: 'string' },
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'number' },
      ]
    };
    const sql = rdfEntityToSqlColumns(entity);
    expect(sql).toBe(fmtSql(`
      subject as [id],
      MAX(CASE predicate WHEN 'name' THEN value END) as [name],
      MAX(CASE predicate WHEN 'age' THEN value END) as [age]
    `));
  });

  it('should use id as the default column', () => {
    const entity: IEntity = {
      name: 'Person',
      fields: [
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'number' },
      ]
    };
    const sql = rdfEntityToSqlColumns(entity);
    expect(sql).toBe(fmtSql(`
      subject as [id],
      MAX(CASE predicate WHEN 'name' THEN value END) as [name],
      MAX(CASE predicate WHEN 'age' THEN value END) as [age]
    `));
  });

  it('should allow id to be in the fields list and there be no primary key', () => {
    const entity: IEntity = {
      name: 'Person',
      fields: [
        { name: 'id', dataType: 'string' },
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'number' },
      ]
    };
    const sql = rdfEntityToSqlColumns(entity);
    expect(sql).toBe(fmtSql(`
      subject as [id],
      MAX(CASE predicate WHEN 'name' THEN value END) as [name],
      MAX(CASE predicate WHEN 'age' THEN value END) as [age]
    `));
  });
})

describe.skip('dataFilterToRdfQuery', () => {

});