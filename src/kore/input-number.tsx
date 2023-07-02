import { unwrap } from 'knockout';
import _, { isNumber } from 'lodash';
import React, { useState } from 'react';
import { formatMoney } from '../utils';
import { useObservable } from './hooks';

interface IProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  value: any
  format?: 'money'
  precision?: number
  refPassthrough?: any
}

export function InputNumber(props: IProps) {
  let { format, precision, refPassthrough } = props;
  if (!_.isNumber(precision)) {
    precision = 2;
  }

  let propsPassthrough = { ...props };
  ['value', 'format', 'precision', 'refPassthrough'].forEach(name => (delete propsPassthrough[name]));

  const [value, setValue] = useObservable(props.value);

  let [displayValue, setDisplayValue] = useState<string>(() => {
    if (isNaN(Number(value)) || value === null || String(value).trim() === '') {
      return '';
    }
    if (format === 'money') {
      return formatMoney(Number(unwrap(props.value)), precision);
    }
    return String(value);
  });
  

  function onChange(evt: React.ChangeEvent<HTMLInputElement>) {
    let _value: any = evt.target.value;
    setDisplayValue(_value);
    // convert blank to null
    if (String(_value).trim() === '') {
      setValue(null);
      return;
    }
    
    _value = _value.replace(/\$/g, '');
    _value = Number(_value);
    if (isNumber(_value) && !isNaN(_value)) {
      setValue(_value);
    }
  }

  function onBlur(evt: React.FocusEvent<HTMLInputElement>) {
    if (format === 'money' && !isNaN(Number(value)) && value !== null && String(value).trim() !== '') {
      const fmtMoney = formatMoney(value, precision);
      setDisplayValue(fmtMoney);
    } else if (value === null) {
      setDisplayValue('');
    } else {
      setDisplayValue(String(value));
    }
    // todo if not money format precision and set display
  }

  return (
    <input {...propsPassthrough} ref={refPassthrough} value={displayValue} onChange={onChange} onBlur={onBlur} />
  )
}