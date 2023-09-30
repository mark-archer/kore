import { Observable, observable } from 'knockout';
import { Collection, IField } from './collection';
import { uniq, cloneDeep } from 'lodash';


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
	data = {},
	collection?: Collection<T>,
):
	IDoc<T> {
	if (!collection) {
		const fields: IField[] = Object.keys(data).map(name => {
			const dataType = typeof data[name];
			if (dataType === 'bigint' || dataType === 'function' || dataType === 'object' || dataType === 'symbol' || dataType === 'undefined') {
				throw new Error(`Unsupported type for field: ${name}: ${dataType}`);
			}
			return {
				name,
				dataType,
			}
		})
		collection = new Collection({
			name: 'AnonymousType',
			fields,
		}, null, null);
	}

	const columns = [collection.primaryKey, ...collection.fields];
	// @ts-ignore
	const doc: IDoc<T> = {
		isNew: true,
		collection,
		q: observable(0),
		qs: {},
		load: async (objOrId?: any) => {
			let loadedFromDb = false;
			if (typeof objOrId !== 'object') {
				const id: string = objOrId || doc[collection.primaryKey.name];
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
			const _data = cloneDeep(data);
			for (const field of collection.fields) {
				_data[field.name] = doc[field.name];
			}
			return _data;
		},
		validationError: observable(null),
		validate: () => {
			try {
				const _data = doc.toJS();
				for (const field of collection.fields) {
					if (_data[field.name] === undefined) {
						if (typeof field.defaultValue === "function") {
							_data[field.name] = field.defaultValue();
						} else if (field.defaultValue !== undefined) {
							_data[field.name] = field.defaultValue;
						} else {
							_data[field.name] = undefined;
						}
					}
				}
				collection.validate(_data);
				doc.validationError(null);
				return _data;
			} catch (err) {
				doc.validationError(err);
				throw err;
			}
		},
		save: async () => {
			let _data = doc.validate();
			const src: any = await collection.save(_data);
			return doc.load(src).then(() => {
				doc.isNew = false;
				doc.q(0);
			});
		},
		delete: async () => {
			await collection.remove(doc[collection.primaryKey.name])
			return doc;
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

	const fieldNames = uniq([...columns.map(c => c.name), ...Object.keys(data)]);
	fieldNames.forEach(fieldName => {
		const fieldQ = observable(data[fieldName]);
		fieldQ.subscribe(() => {
			data[fieldName] = fieldQ();
			doc.q(doc.q() + 1);
		});
		doc.qs[fieldName] = fieldQ;
		Object.defineProperty(doc, fieldName, {
			get: () => {
				return fieldQ();
			},
			set: value => {
				data[fieldName] = value;
				fieldQ(value);
			}
		});
	});

	return doc;
}

//@ts-ignore
if (typeof window !== 'undefined') window.newDoc = newDoc;