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

export function isObject(x: any): x is Record<string,any> {
  return _.isObject(x) && !_.isArray(x) && !_.isDate(x) && x !== null;
}

export function js(jsCode: string, externalReferences?: any) {
  const hideGlobals = [
    'process', 'global'//,'setTimeout','setInterval','setImmediate','clearImmediate','clearInterval','clearTimeout'    
  ];
  const common = module.exports;
  const refNames = ['console', 'common'];
  const refValues = [console, common];
  _.keys(externalReferences).forEach(key => {
    refNames.push(key);
    refValues.push(externalReferences[key]);
  })
  const compiledJs = Function.apply(null, [...refNames, ...hideGlobals, '"use strict";  ' + jsCode.trim()]);
  return compiledJs.apply(null, refValues);
}

// must be done this way so TypeScript doesn't rewrite async keyword
export const AsyncFunction = eval('Object.getPrototypeOf(async function () { }).constructor');

export function jsAsync(jsCode: string, externalReferences: any = {}) {
  jsCode = String(jsCode).trim()
  const hideGlobals = [
    'process', 'global'//,'setTimeout','setInterval','setImmediate','clearImmediate','clearInterval','clearTimeout'    
  ];
  const utils = module.exports;
  const refNames = ['utils', 'utils_1', 'Promise', 'console'];
  const refValues = [utils, utils, Promise, console];
  _.keys(externalReferences).forEach(key => {
    refNames.push(key);
    refValues.push(externalReferences[key]);
  })
  const compiledJs = AsyncFunction.apply(null, [...refNames, ...hideGlobals, '"use strict";\n' + jsCode]);
  return compiledJs.apply(null, refValues);
}

export function toJSON(obj: any) {

  //console.log('toJSON');
  const knownObjs: any[] = [];
  const objRefs: any[] = [];
  const newObjs: any[] = [];
  let refCount = 0;

  function recurse(obj: any) {

    // stringify values
    if (Number.isNaN(obj))
      return "NaN";
    if (obj === undefined)
      return "undefined";
    if (obj === Infinity)
      return "Infinity";
    if (obj instanceof RegExp)
      return ("__REGEXP " + obj.toString());
    //   if(isDate(obj))
    //       return "__DATE " + obj.toISOString();
    if (_.isDate(obj))
      return obj.toISOString();
    if (_.isFunction(obj))
      return '__FUNCTION ' + obj.toString();
    if (_.isElement(obj)) {
      return "__HTML " + obj.outerHTML;
    }
    if (typeof window !== 'undefined' && window && obj === window) {
      return "__WINDOW";
    }
    if (_.isError(obj)) {
      return "__ERROR " + obj.stack;
    }

    // non-objects can just be returned at this point
    if (!(isObject(obj) || _.isArray(obj))) {
      return obj;
    }

    // if we've found a duplicate reference, deal with it
    var iObj = knownObjs.indexOf(obj);
    if (iObj >= 0) {
      var ref = objRefs[iObj];

      var nObj = newObjs[iObj];
      if (_.isArray(nObj) && (!_.isString(nObj[0]) || !nObj[0].match(/^__this_ref:/)))
        nObj.unshift("__this_ref:" + ref);
      else if (isObject(nObj) && !nObj.__this_ref)
        nObj.__this_ref = ref;
      return ref;
    }

    // capture references in case we need them later
    refCount++;
    var newRef = "__duplicate_ref_" + (_.isArray(obj) ? "ary_" : "obj_") + refCount;
    var nObj: (any[] | any) = _.isArray(obj) ? [] : {};
    knownObjs.push(obj);
    objRefs.push(newRef);
    newObjs.push(nObj);

    // recurse on properties
    if (_.isArray(obj))
      for (var i = 0; i < obj.length; i++)
        nObj.push(recurse(obj[i])); // use push so offset from reference capture doesn't mess things up
    else
      for (var key in obj) {
        if (!(obj && obj.hasOwnProperty && obj.hasOwnProperty(key))) continue;
        var value = recurse(obj[key]);
        if (key[0] == '$') // escape leading dollar signs
          key = '__DOLLAR_' + key.substr(1);
        nObj[key] = value;
      }
    return nObj;
  }
  obj = recurse(obj);
  return obj;
}

export function fromJSON(obj: any, externalReferences?: any) {
  //console.log('fromJSON');
  var dup_refs: any = {};

  function recurse(obj: any) {

    if (_.isString(obj)) {

      // restore values
      if (obj === "undefined")
        return undefined;
      if (obj === "NaN")
        return NaN;
      if (obj === "Infinity")
        return Infinity;
      if (obj.match(/^__REGEXP /)) {
        var m: any = obj.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
        return new RegExp(m[1], m[2] || "");
      }
      if (obj.match(/^\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}\.\d{3}Z$/)) {
        return new Date(obj)
      }
      if (obj.match(/^__FUNCTION /)) {
        return js(obj.substring(11), externalReferences);
      }
      if (obj.match(/^__HTML /)) {
        //@ts-ignore 
        if (typeof $ !== 'undefined') return $(obj.substring(7))[0];
        else return obj;
      }
      if (obj.startsWith("__ERROR ")) {
        let error = new Error();
        error.stack = obj.substring(8);
        return error;
      }
      if (obj === "__WINDOW") {
        return window;
      }

      // deal with duplicate refs
      if (obj.match(/^__duplicate_ref_/)) {
        if (!dup_refs[obj])
          dup_refs[obj] = obj.match(/_obj_/) ? {} : [];
        return dup_refs[obj];
      }
    }

    if (!(isObject(obj) || _.isArray(obj)))
      return obj;

    // deal with objects that have duplicate refs
    var dup_ref = null;
    obj = _.clone(obj); // don't mess up the original JSON object
    if (_.isArray(obj) && _.isString(obj[0]) && obj[0].match(/^__this_ref:/))
      dup_ref = obj.shift().split(':')[1];
    else if (obj.__this_ref) {
      dup_ref = obj.__this_ref;
      delete obj.__this_ref;
    }

    var mObj: any = _.isArray(obj) ? [] : {};
    if (dup_ref)
      if (!dup_refs[dup_ref])
        dup_refs[dup_ref] = mObj;
      else
        mObj = dup_refs[dup_ref];

    // restore keys and recurse on objects
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      var value = recurse(obj[key]);
      if (key.match(/^__DOLLAR_/))
        key = '$' + key.substr(9);
      mObj[key] = value;
    }
    return mObj;
  }
  obj = recurse(obj);
  return obj;
}

// @ts-ignore
window.utils = module.exports;