import _ from 'lodash';

export type IObjectMatch<T> = {
  [key in keyof T]?: RegExp | string | number | boolean
}

export function objectMatch<T>(value: T, match: IObjectMatch<T>): boolean {
  for (const [k, _m] of Object.entries(match)) {
    const m = _m as any;
    if (m === undefined) continue; // NOTE we are not trying to match undefined values
    // NOTE null will match null or undefined
    if (m === null && (value[k] === null || value[k] === undefined)) {
      return true
    }
    if (_.isRegExp(m)) {
      if (!String(value[k]).match(m)) {
        return false;
      }
    } else if (m != value[k]) {
      return false;
    }
  }
  return true;
}

export function camelCaseToSpaces(s: string) {
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  // s = s.replace(/(GL)([A-Z])/g, '$1 $2');  // anything like GLAccounts, GLBatches, etc. 
  s = s.replace("_", " ");
  s = s[0]?.toUpperCase() + s.substr(1);
  return s;
}

export function camelCaseToHyphens(s: string) {
  s = camelCaseToSpaces(s);
  return s.split(' ').join('-').toLowerCase();
}

export const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, precision: number = 2) {
  if (precision === 2) {
    return moneyFormatter.format(value);
  }
  const _moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return _moneyFormatter.format(value)
}

// @ts-ignore
window.utils = module.exports;