
import { Observable, observable, observableArray, ObservableArray } from 'knockout';
import { IDoc, newDoc } from './doc';
import { IObjectMatch, objectMatch } from '../utils';
import { config } from './factory';

export interface IEntity {
  id?: string
  name: string
  namePlural?: string
  fields: IField[]
  primaryKey?: IField
  extends?: IEntity
  displayValue?: string | ((doc: any) => string)
}

export type FieldType = 'id' | 'string' | 'boolean' | 'number' | 'Date' | 'any';

export interface IField {
	name: string
	displayName?: string
	dataType: FieldType
	optional?: boolean
	array?: boolean
	defaultValue?: any
	fkType?: IEntity
	fkCollection?: Collection<any>
	format?: 'money' | 'date' | 'datetime'
}

export type ICursorDirection = 'next' | 'nextunique' | 'prev' | 'prevunique';

export interface ICursor<T> {
	value: T;
	next: () => Promise<T | boolean>;
}

export interface IDataSource<T> {
	get(id: string): Promise<T | null>
	list(
		lastModified?: number,
		group?: string,
		direction?: ICursorDirection,
	): Promise<ICursor<T>>
	save(data: T): Promise<T>
	remove(data: T): Promise<boolean>
}

export const collections: Collection<any>[] = [];

export class Collection<T> {

	fields: IField[]
	entityName: string
	readonly primaryKey: IField

	constructor(
		readonly entity: IEntity,
		readonly validate: (data: T) => void,
		private dataSource: IDataSource<T>,
		primaryKey?: IField,
	) {
		collections.push(this);
		this.entityName = entity.name;
		let _entity: IEntity | undefined = entity;
		this.fields = [];

		// load all fields, including from extended (parent) entities 
		while (_entity) {
			this.fields = [...this.fields, ..._entity.fields];
			if (!primaryKey) {
				primaryKey = _entity.primaryKey;
			}
			_entity = _entity.extends;
		}

		this.primaryKey = primaryKey ?? config.defaultPrimaryKey;

		// set fkCollection for any fkFields that reference this collection
		for (const collection of collections) {
			for (const field of collection.fields) {
				if (field.fkType?.name === this.entityName) {
					field.fkCollection = this;
				}
			}
		}
		// try to set fkCollection for any of this collections fkFields
		for (const field of this.fields) {
			if (field.fkType && !field.fkCollection) {
				for (const collection of collections) {
					if (field.fkType?.name === collection.entityName) {
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

	init(_data: Partial<T> = {}): IDoc<T> {
		const data = _data as any;
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
				} else {
					// @ts-ignore
					data[c.name] = c.defaultValue;
				}
			}
		})
		const doc = newDoc(data, this);
		doc.isNew = isNew;
		return doc;
	}

	async get(id: string): Promise<IDoc<T> | null> {
		if (!id) {
			return null;
		}
		// const db = await getDB();
		// const doc = await db.get(id);
		const doc = await this.dataSource.get(id);
		if (doc) {
			return this.init(doc as any)
		} else {
			return null;
		}
	}

	async list(
		match?: IObjectMatch<T> | ((doc: T) => (boolean | Promise<boolean>)),
		limit?: number,
		lastModified?: number,
		group?: string,
		direction: ICursorDirection = 'next',
	): Promise<IDoc<T>[]> {
		console.log('list', { type: this.entityName, match, limit, lastModified }); // leave this so queries are very visible 
		const cursor = await this.dataSource.list(lastModified, group, direction);
		const results = [];
		while (await cursor.next()) {
			const value = cursor.value;
			if (typeof match === 'function') {
				if (!(await match(value))) {
					continue;
				}
			} else if (match && !objectMatch(value, match)) {
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
	async search(text: string, limit?: number, lastModified?: number, group?: string, direction?: ICursorDirection): Promise<IDoc<T>[]> {
		function matchAnyText(doc: T) {
			if (JSON.stringify(doc).toLowerCase().includes(text)) {
				return true;
			}
			return false;
		}
		return this.list(matchAnyText, limit, lastModified, group, direction);
	}

	async save(_entity: T): Promise<T> {
		return this.dataSource.save(_entity);
	}

	async remove(entity: T | string) {
		if (typeof entity === 'string') {
			entity = await this.dataSource.get(entity);
			if (!entity) {
				return true;
			}
		}
		await this.dataSource.remove(entity);
		return true;
	}

	observables = {
		get: (id: string): Observable<IDoc<T>> => {
			const d = this.init({ id } as any);
			const o = observable(d);
			d.load().then(() => o.notifySubscribers(d));
			return o;
		},
		list: (
			match?: IObjectMatch<T> | ((doc: T) => (boolean | Promise<boolean>)),
			limit?: number,
			lastModified?: number,
			group?: string,
			direction?: ICursorDirection,
		): ObservableArray<IDoc<T>> => {
			const obsAry = observableArray<IDoc<T>>([]);
			this.list(match, limit, lastModified, group, direction).then(results => obsAry(results))
			return obsAry
		},
		search: (
			text: string,
			limit?: number,
			lastModified?: number,
			group?: string,
			direction?: ICursorDirection
		): ObservableArray<IDoc<T>> => {
			const obsAry = observableArray<IDoc<T>>([]);
			this.search(text, limit, lastModified, group, direction).then(results => obsAry(results))
			return obsAry
		}
	}
}