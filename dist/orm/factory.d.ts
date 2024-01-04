import { Collection, IDataSource, IEntity, IField } from "./collection";
import { Runtype } from 'runtypes';
export declare const config: {
    RId: Runtype<unknown>;
    dataSourceFactory: <T = any>(entity: IEntity) => IDataSource<T>;
    entities: Record<string, IEntity>;
    defaultPrimaryKey: IField;
};
export declare function pluralize(name: string): string;
export declare function singular(name: string): string;
export declare function generateTypedEntity(entity: IEntity, options?: {
    fs?: any;
    dontGenInterface?: boolean;
    dontWiteFile?: boolean;
    fileDir?: string;
    fileName?: string;
    fileHeader?: string;
    fileFooter?: string;
}): Promise<string | true>;
export declare function validationFactory(entity: IEntity): (data: any) => void;
export declare function collectionFactory<T>(entity: IEntity, dataSource?: IDataSource<T>, validate?: ((data: any) => void)): Collection<T>;
export declare function arrayAsCollection<T>(ary: T[], entityOpts?: Partial<IEntity>): Collection<T>;
