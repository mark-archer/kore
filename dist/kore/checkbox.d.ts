import React from 'react';
interface IProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    checked: any;
    type?: React.HTMLInputTypeAttribute;
}
export declare function Checkbox(props: IProps): JSX.Element;
export {};
