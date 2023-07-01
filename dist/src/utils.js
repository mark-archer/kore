"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJSON = exports.toJSON = exports.jsAsync = exports.AsyncFunction = exports.js = exports.isObject = exports.formatMoney = exports.moneyFormatter = exports.camelCaseToHyphens = exports.camelCaseToSpaces = exports.objectMatch = void 0;
const lodash_1 = __importDefault(require("lodash"));
function objectMatch(value, match) {
    for (const [k, _m] of Object.entries(match)) {
        const m = _m;
        if (m === undefined)
            continue; // NOTE we are not trying to match undefined values
        // NOTE null will match null or undefined
        if (m === null && (value[k] === null || value[k] === undefined)) {
            return true;
        }
        if (lodash_1.default.isRegExp(m)) {
            if (!String(value[k]).match(m)) {
                return false;
            }
        }
        else if (m != value[k]) {
            return false;
        }
    }
    return true;
}
exports.objectMatch = objectMatch;
function camelCaseToSpaces(s) {
    var _a;
    s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
    // s = s.replace(/(GL)([A-Z])/g, '$1 $2');  // anything like GLAccounts, GLBatches, etc. 
    s = s.replace("_", " ");
    s = ((_a = s[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) + s.substr(1);
    return s;
}
exports.camelCaseToSpaces = camelCaseToSpaces;
function camelCaseToHyphens(s) {
    s = camelCaseToSpaces(s);
    return s.split(' ').join('-').toLowerCase();
}
exports.camelCaseToHyphens = camelCaseToHyphens;
exports.moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
function formatMoney(value, precision = 2) {
    if (precision === 2) {
        return exports.moneyFormatter.format(value);
    }
    const _moneyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    });
    return _moneyFormatter.format(value);
}
exports.formatMoney = formatMoney;
function isObject(x) {
    return lodash_1.default.isObject(x) && !lodash_1.default.isArray(x) && !lodash_1.default.isDate(x) && x !== null;
}
exports.isObject = isObject;
function js(jsCode, externalReferences) {
    const hideGlobals = [
        'process', 'global' //,'setTimeout','setInterval','setImmediate','clearImmediate','clearInterval','clearTimeout'    
    ];
    const common = module.exports;
    const refNames = ['console', 'common'];
    const refValues = [console, common];
    lodash_1.default.keys(externalReferences).forEach(key => {
        refNames.push(key);
        refValues.push(externalReferences[key]);
    });
    const compiledJs = Function.apply(null, [...refNames, ...hideGlobals, '"use strict";  ' + jsCode.trim()]);
    return compiledJs.apply(null, refValues);
}
exports.js = js;
// must be done this way so TypeScript doesn't rewrite async keyword
exports.AsyncFunction = eval('Object.getPrototypeOf(async function () { }).constructor');
function jsAsync(jsCode, externalReferences = {}) {
    jsCode = String(jsCode).trim();
    const hideGlobals = [
        'process', 'global' //,'setTimeout','setInterval','setImmediate','clearImmediate','clearInterval','clearTimeout'    
    ];
    const utils = module.exports;
    const refNames = ['utils', 'utils_1', 'Promise', 'console'];
    const refValues = [utils, utils, Promise, console];
    lodash_1.default.keys(externalReferences).forEach(key => {
        refNames.push(key);
        refValues.push(externalReferences[key]);
    });
    const compiledJs = exports.AsyncFunction.apply(null, [...refNames, ...hideGlobals, '"use strict";\n' + jsCode]);
    return compiledJs.apply(null, refValues);
}
exports.jsAsync = jsAsync;
function toJSON(obj) {
    //console.log('toJSON');
    const knownObjs = [];
    const objRefs = [];
    const newObjs = [];
    let refCount = 0;
    function recurse(obj) {
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
        if (lodash_1.default.isDate(obj))
            return obj.toISOString();
        if (lodash_1.default.isFunction(obj))
            return '__FUNCTION ' + obj.toString();
        if (lodash_1.default.isElement(obj)) {
            return "__HTML " + obj.outerHTML;
        }
        if (typeof window !== 'undefined' && window && obj === window) {
            return "__WINDOW";
        }
        if (lodash_1.default.isError(obj)) {
            return "__ERROR " + obj.stack;
        }
        // non-objects can just be returned at this point
        if (!(isObject(obj) || lodash_1.default.isArray(obj))) {
            return obj;
        }
        // if we've found a duplicate reference, deal with it
        var iObj = knownObjs.indexOf(obj);
        if (iObj >= 0) {
            var ref = objRefs[iObj];
            var nObj = newObjs[iObj];
            if (lodash_1.default.isArray(nObj) && (!lodash_1.default.isString(nObj[0]) || !nObj[0].match(/^__this_ref:/)))
                nObj.unshift("__this_ref:" + ref);
            else if (isObject(nObj) && !nObj.__this_ref)
                nObj.__this_ref = ref;
            return ref;
        }
        // capture references in case we need them later
        refCount++;
        var newRef = "__duplicate_ref_" + (lodash_1.default.isArray(obj) ? "ary_" : "obj_") + refCount;
        var nObj = lodash_1.default.isArray(obj) ? [] : {};
        knownObjs.push(obj);
        objRefs.push(newRef);
        newObjs.push(nObj);
        // recurse on properties
        if (lodash_1.default.isArray(obj))
            for (var i = 0; i < obj.length; i++)
                nObj.push(recurse(obj[i])); // use push so offset from reference capture doesn't mess things up
        else
            for (var key in obj) {
                if (!(obj && obj.hasOwnProperty && obj.hasOwnProperty(key)))
                    continue;
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
exports.toJSON = toJSON;
function fromJSON(obj, externalReferences) {
    //console.log('fromJSON');
    var dup_refs = {};
    function recurse(obj) {
        if (lodash_1.default.isString(obj)) {
            // restore values
            if (obj === "undefined")
                return undefined;
            if (obj === "NaN")
                return NaN;
            if (obj === "Infinity")
                return Infinity;
            if (obj.match(/^__REGEXP /)) {
                var m = obj.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
                return new RegExp(m[1], m[2] || "");
            }
            if (obj.match(/^\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}\.\d{3}Z$/)) {
                return new Date(obj);
            }
            if (obj.match(/^__FUNCTION /)) {
                return js(obj.substring(11), externalReferences);
            }
            if (obj.match(/^__HTML /)) {
                //@ts-ignore 
                if (typeof $ !== 'undefined')
                    return $(obj.substring(7))[0];
                else
                    return obj;
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
        if (!(isObject(obj) || lodash_1.default.isArray(obj)))
            return obj;
        // deal with objects that have duplicate refs
        var dup_ref = null;
        obj = lodash_1.default.clone(obj); // don't mess up the original JSON object
        if (lodash_1.default.isArray(obj) && lodash_1.default.isString(obj[0]) && obj[0].match(/^__this_ref:/))
            dup_ref = obj.shift().split(':')[1];
        else if (obj.__this_ref) {
            dup_ref = obj.__this_ref;
            delete obj.__this_ref;
        }
        var mObj = lodash_1.default.isArray(obj) ? [] : {};
        if (dup_ref)
            if (!dup_refs[dup_ref])
                dup_refs[dup_ref] = mObj;
            else
                mObj = dup_refs[dup_ref];
        // restore keys and recurse on objects
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
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
exports.fromJSON = fromJSON;
// @ts-ignore
if (typeof window !== 'undefined')
    window.utils = module.exports;
//# sourceMappingURL=utils.js.map