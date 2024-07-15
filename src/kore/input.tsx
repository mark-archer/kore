import React from 'react'; 
import { useObservable } from './hooks';

interface IProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  value: any,
  type?: React.HTMLInputTypeAttribute
}

export function Input(props: IProps) {
  const [value, setValue] = useObservable(props.value);
  const type = props.type ?? (typeof value);
  function onChange(evt: React.ChangeEvent<HTMLInputElement>) {
    let _value: any = evt.target.value;
    if (type === 'number') {
      _value = Number(_value);
    }
    setValue(_value);
  }
  return (
    <input onChange={onChange} type={type} {...props} value={value}  />
  )
}