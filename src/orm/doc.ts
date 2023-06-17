import { Observable, observable } from 'knockout';
import { Record as RObject } from 'runtypes';
import { Collection } from './collection';


export type IDoc<T> = {	
  load: (objOrId?) => Promise<IDoc<T>>
	save: () => Promise<IDoc<T>>
  delete: () => Promise<void>
  toJS: () => T
	validate: () => T
	validationError: Observable<any>
	collection: Collection<T>
	qs: {
		[K in keyof T]-?: Observable<T[K]>
	}
	q: Observable<number>
	displayValue: (() => string)
	primaryKey: (() => string | number)
	isNew: boolean
	hasChanges: () => boolean
} & {
	[key in keyof T]: T[key];
}


// TODO changing this to a class would probably be a significant performance boost
//			because each one of those functions would only be instantiated once instead of for every doc
//			NOTE: I gave this a shot and found out indexing fields is clear cut and the `this` binding becomes a problem
export function newDoc<T>(
	collection: Collection<T>,
	data = {}
): 
	IDoc<T> 
{
	const columns = [collection.primaryKey, ...collection.fields];
	// @ts-ignore
	const doc: IDoc<T> = {
		isNew: true,
		collection, 
		q: observable(0),
		qs: {},
		load: async (objOrId?: any) => {
			if (typeof objOrId !== 'object') {
				const id: string = objOrId || doc[collection.primaryKey.name];
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
			const _data = {...data} as any;
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
			const src: any = await collection.save(data)
			return doc.load(src).then(() => {
				doc.isNew = false;
				doc.q(0);
			});
		},
		delete: async () => {
			await collection.remove(doc[collection.primaryKey.name])
			return doc;
		},
		validationError: observable(null),
		validate: () => {
			try {
				const data = doc.toJS();
				collection.validate(data);
				doc.validationError(null);
				return data;
			} catch (err) {
				doc.validationError(err);
				throw err;
			}
		},
		displayValue: () => {
			let displayValue = collection.entity.displayValue;
			if (!displayValue) {
				displayValue = collection.fields.find(c => c.dataType === 'string')?.name;
			}
			if (typeof displayValue === 'function') {
				return displayValue(doc);
			} else if (displayValue) {
				return doc[displayValue]
			} else {
				return doc[collection.primaryKey.name];
			}
		},
		primaryKey: () => doc[collection.primaryKey.name],
		hasChanges: () => doc.isNew || doc.q() !== 0,
	}

	columns.forEach(col => {
		const fieldQ = observable(data[col.name]);
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

//@ts-ignore
if (typeof window !== 'undefined') window.newDoc = newDoc;