import _ from 'lodash';

export type FetchMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export function PushNotifications_urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function htmlToText(html: string): string {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

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

export function cloneClean(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

export function parseMoney(strAmount: string) {
  strAmount = strAmount.trim();
  let isNegative = strAmount.startsWith("(");
  strAmount = strAmount.replace("(", "").replace(")", "");
  let amount = Number(strAmount.replace(/[^0-9.-]+/g,""));
  amount = amount * (isNegative ? -1 : 1);
  return amount;
}

// @ts-ignore
window.utils = module.exports;