import React from 'react';
interface IProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    value: any;
    format?: 'money';
    precision?: number;
    refPassthrough?: any;
}
export declare function InputNumber(props: IProps): JSX.Element;
export {};
