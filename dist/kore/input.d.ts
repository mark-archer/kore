import React from 'react';
interface IProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    value: any;
    type?: React.HTMLInputTypeAttribute;
}
export declare function Input(props: IProps): JSX.Element;
export {};
