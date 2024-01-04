// import { Observable, observable } from 'knockout';
// import { Record as RObject } from 'runtypes';
// import { Collection, IField } from './collection';


// export type IDoc<T> = {	
//   load: (objOrId?) => Promise<IDoc<T>>
// 	save: () => Promise<IDoc<T>>
//   delete: () => Promise<void>
//   toJS: () => T
// 	validate: () => T
// 	validationError: Observable<any>
// 	collection: Collection<T>
// 	qs: {
// 		[K in keyof T]-?: Observable<T[K]>
// 	}
// 	q: Observable<number>
// 	displayValue: (() => string)
// 	primaryKey: (() => string | number)
// 	isNew: boolean
// } & {
// 	[key in keyof T]: T[key];
// }


// // TODO changing this to a class would probably be a significant performance boost
// //			because each one of those functions would only be instantiated once instead of for every doc

// export class Doc<T> {

// 	[key: in keyof T]: T[key];

// 	private rtype: RObject<any, false>; 
// 	private columns: IField[];
// 	public readOnly q = observable(0);
// 	public readOnly qs: {
// 		[K in keyof T]-?: Observable<T[K]>
// 	} = {} as any;

// 	public readOnly validationError = observable(null);
// 	public isNew = true;

// 	constructor(
// 		readOnly collection: Collection<T>,
// 		data = {}
// 	) {
// 			this.rtype = (collection.rtype as any) as RObject<any, false>;
// 			this.columns = [collection.primaryKey, ...collection.fields];

// 			this.columns.forEach(col => {
// 				const fieldQ = observable(data[col.name]);
// 				fieldQ.subscribe(() => this.q(this.q() + 1));
// 				// @ts-ignore
// 				doc.qs[col.name] = fieldQ;
// 				Object.defineProperty(this, col.name, {
// 					get: () => fieldQ(),
// 					set: value => fieldQ(value)
// 				});
// 			});	
// 	}

// 	async load (objOrId?: any) {
// 		if (typeof objOrId !== 'object') {
// 			const id: string = objOrId || this[this.collection.primaryKey.name];
// 			if (!id) {
// 				return this;
// 			}
// 			objOrId = await this.collection.get(id);
// 			if (!objOrId) {
// 				throw new Error(`Could not find doc for ${this.collection.entityName}:${id}`);
// 			}
// 			this.isNew = false;
// 			this.q(0);
// 		}
// 		for (const col of this.columns) {
// 			if (objOrId[col.name] !== undefined) {
// 				// @ts-ignore
// 				doc[col.name] = objOrId[col.name];
// 			}
// 		}
// 		return this;
// 	}
	
// 	toJS() {
// 		const _data = {...this} as any;
// 		this.columns.forEach(col => {
// 			const value = this[col.name];
// 			if (typeof value !== 'function') {
// 				_data[col.name] = value;
// 			}
// 		});
// 		return _data as T;
// 	}

// 	async save () {
// 		const data = this.validate();
// 		const validationResult = this.rtype.validate(data)
// 		if (!validationResult.success){
// 			const details = (validationResult as any)?.details;
// 			throw new Error('Validation failed: ' + JSON.stringify(details, null, 2))
// 		}
// 		const src: any = await this.collection.save(data)
// 		return this.load(src).then(() => {
// 			this.isNew = false;
// 			this.q(0);
// 		});
// 	}

// 	async delete () {
// 		await this.collection.remove(this[this.collection.primaryKey.name])
// 		return this;
// 	}

// 	validate() {
// 		try {
// 			const data = this.toJS();
// 			const validationResult = this.rtype.validate(data)
// 			if (!validationResult.success){
// 				const details = (validationResult as any)?.details;
// 				throw new Error('Validation failed: ' + JSON.stringify(details, null, 2))
// 			}
// 			this.validationError(null);
// 			return data;
// 		} catch (err) {
// 			this.validationError(err);
// 			throw err;
// 		}
// 	}

// 	displayValue() {
// 		let displayValue = this.collection.entity.displayValue;
// 		if (!displayValue) {
// 			displayValue = this.collection.fields.find(c => c.dataType === 'string')?.name;
// 		}
// 		if (typeof displayValue === 'function') {
// 			return displayValue(this);
// 		} else if (displayValue) {
// 			return this[displayValue]
// 		} else {
// 			return this[this.collection.primaryKey.name];
// 		}
// 	}

// 	primaryKey() {
// 		return this[this.collection.primaryKey.name];
// 	}
// }


// //@ts-ignore
// window.Doc = Doc;