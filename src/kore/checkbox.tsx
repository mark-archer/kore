import React from 'react'; 
import { useObservable } from './hooks';

interface IProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  checked: any,
  type?: React.HTMLInputTypeAttribute
}

export function Checkbox(props: IProps) {
  const [checked, setChecked] = useObservable(props.checked);
  const type = props.type ?? 'checkbox';
  function onChange(evt: React.ChangeEvent<HTMLInputElement>) {
    let _value: any = evt.target.checked;
    if (type === 'checkbox') {
      _value = !!_value;
    }
    setChecked(_value);
  }
  return (
    <input onChange={onChange} type={type} {...props} checked={checked}  />
  )
}