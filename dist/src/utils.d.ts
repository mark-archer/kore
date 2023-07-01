export type IObjectMatch<T> = {
    [key in keyof T]?: RegExp | string | number | boolean;
};
export declare function objectMatch<T>(value: T, match: IObjectMatch<T>): boolean;
export declare function camelCaseToSpaces(s: string): string;
export declare function camelCaseToHyphens(s: string): string;
export declare const moneyFormatter: Intl.NumberFormat;
export declare function formatMoney(value: number, precision?: number): string;
export declare function isObject(x: any): x is Record<string, any>;
export declare function js(jsCode: string, externalReferences?: any): any;
export declare const AsyncFunction: any;
export declare function jsAsync(jsCode: string, externalReferences?: any): any;
export declare function toJSON(obj: any): any;
export declare function fromJSON(obj: any, externalReferences?: any): any;
