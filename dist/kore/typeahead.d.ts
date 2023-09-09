/// <reference types="react" />
import { MaybeObservable } from 'knockout';
interface IProps<T> {
    source?: (query: string) => Promise<T[]>;
    options?: MaybeObservable<T[]>;
    value?: MaybeObservable<T>;
    displayField?: string | ((x: T) => string);
    minLength?: number;
    afterChange?: (value: T) => any;
    placeholder?: string;
    innerRef?: any;
    dontLoadEmptyString?: boolean;
    dontSortSourceResults?: boolean;
}
export declare function Typeahead<T>(props: IProps<T>): JSX.Element;
export {};
