const methods = require('./methods');

/**
 * Utilities.
 */
const utilities = {
  unset: (obj, path, separator = '.') => {
    if (obj && typeof obj[methods.toOperation] === 'function') {
      obj = obj[methods.toOperation]();
    } else if (obj && typeof obj.toJSON === 'function') {
      obj = obj.toJSON();
    }
    if (typeof path === 'number') {
      path = [path];
    }
    if (obj === null || typeof obj === 'undefined') {
      return obj; // Nothing to do.
    }
    if (!path) {
      return obj; // Nothing to do.
    }
    if (typeof path === 'string') {
      return utilities.unset(obj, utilities.splitPath(path, separator));
    }
    const currentPath = path[0];

    if (utilities.isPrototypePollutionProp(currentPath)) {
      throw new Error('Denying write access to prototype prop.');
    }
    if (currentPath === '*'){
      const type = utilities.type(obj);

      if (type === 'Object'){
        const keys = Object.keys(obj);

        for (const key of keys){
          delete obj[key];
        }
      } else if (type === 'Array') {
        obj.splice(0, obj.length);
      }
      return obj;
    }
    if (path.length === 1) {
      if (Array.isArray(obj)) {
        obj.splice(currentPath, 1);
      } else {
        delete obj[currentPath];
      }
    } else {
      const type = utilities.type(obj[currentPath]);

      if (path[1] === '*' && type !== 'Object' && type !== 'Array'){
        obj[currentPath] = undefined;
      } else {
        return utilities.unset(obj[currentPath], path.slice(1), separator);
      }
    }
    return obj;
  },

  get: (obj, path, defaultValue, separator = '.') => {
    if (obj && typeof obj[methods.toOperation] === 'function') {
      obj = obj[methods.toOperation]();
    } else if (obj && typeof obj.toJSON === 'function') {
      obj = obj.toJSON();
    }
    if (typeof path === 'string') {
      path = utilities.splitPath(path, separator);
    }
    if (typeof path === 'number') {
      path = [path];
    }
    if (typeof obj === 'undefined') {
      return defaultValue;
    }
    if (path.length === 0 || null === obj) {
      return obj; // Nothing to get or preserving `null`.
    }
    return utilities.get(obj[path[0]], path.slice(1), defaultValue, separator);
  },

  set: (obj, path, value, doNotReplace, separator = '.') => {
    if (obj && typeof obj[methods.toOperation] === 'function') {
      obj = obj[methods.toOperation]();
    } else if (obj && typeof obj.toJSON === 'function') {
      obj = obj.toJSON();
    }
    if (typeof path === 'number') {
      path = [path];
    }
    if (!path || !path.length) {
      return obj; // Nothing to do.
    }
    if (!Array.isArray(path)) {
      return utilities.set(obj, utilities.splitPath(path, separator), value, doNotReplace, separator);
    }
    const currentPath = path[0];
    const currentValue = obj[currentPath];

    if (utilities.isPrototypePollutionProp(currentPath)) {
      throw new Error('Denying write access to prototype prop.');
    }
    if (path.length === 1) {
      if (!doNotReplace || currentValue === void 0) {
        obj[currentPath] = value;
      }
      return currentValue;
    }
    if (currentValue === void 0) {
      obj[currentPath] = {};
    }
    return utilities.set(obj[currentPath], path.slice(1), value, doNotReplace, separator);
  },

  splitPath: (path, separator = '.') => {
    if (typeof path === 'string') {
      if (path.startsWith(separator)) {
        path = path.substring(separator.length);
      }
      if (path.endsWith(separator)) {
        path = path.substring(0, path.length - separator.length);
      }
      path = path.split(separator).map(name => {
        const index = Number(name);
        return !Number.isNaN(index) && index !== null ? index : name;
      });
    }
    return path;
  },

  equal: function (first, second) {
    return first === second;
  },

  type: function (value) {
    if (value === null) {
      return 'Null';
    }
    if (typeof value === 'undefined') {
      return 'Undefined';
    }
    if (!value.__proto__){
      return 'Object';
    }
    return Object.getPrototypeOf(value).constructor.name;
  },

  typeList(value) {
    let result = [];

    if (value === null) {
      result.push('Null');
    } else if (typeof value === 'undefined') {
      result.push('Undefined');
    } else {
      function getClass(value) {
        if (value && value.constructor) {
          result.push(value.constructor.name);
          getClass(Object.getPrototypeOf(value));
        }
      }
      getClass(Object.getPrototypeOf(value));
    }
    return result;
  },

  instanceof(value, className) {
    if (value === null) {
      return className === 'Null';
    } else {
      function getClass(value) {
        if (value && value.constructor) {
          if (className === value.constructor.name) {
            return true;
          }
          return getClass(Object.getPrototypeOf(value));
        } else {
          return false;
        }
      }
      return getClass(Object.getPrototypeOf(value));
    }
  },

  diff: (source, compare, {ignore = [], separator = '.', white = [], path = '', equal = utilities.equal}, result) => {
    if (!result) {
      result = {$set: {}, $unset: []};
    }
    const sourcePlain = source && typeof source.toJSON === 'function' ? source.toJSON() : source;
    const comparePlain = compare && typeof compare.toJSON === 'function' ? compare.toJSON() : compare;

    const sourceType = utilities.type(sourcePlain);
    const compareType = utilities.type(comparePlain);

    if (sourceType === compareType && sourceType === 'Object') {
      const sourceKeys = Object.keys(sourcePlain);
      const compareKeys = Object.keys(comparePlain);

      for (const key of compareKeys) {
        const p = path ? path + separator + key : key;

        if (!ignore.includes(p) && (white.length === 0 || white.includes(p))) {
          if (!(key in sourcePlain)) {
            result.$set[p] = comparePlain[key];
          } else
          if (!equal(comparePlain[key], sourcePlain[key])) {
            utilities.diff(sourcePlain[key], comparePlain[key], {ignore, separator, white, path: p, equal}, result);
          }
        }
      }
      for (const key of sourceKeys) {
        if (!(key in comparePlain)) {
          const p = path ? path + separator + key : key;
          if (!ignore.includes(p) && (white.length === 0 || white.includes(p))) {
            result.$unset.push(p);
          }
        }
      }
    } else {
      if (!path) {
        result = compare;
      } else {
        if (!ignore.includes(path) && (white.length === 0 || white.includes(path))) {
          result.$set[path] = compare;
        }
      }
    }
    return result;
  },

  plain(value, recursive = true) {
    if (value === null || typeof value === 'undefined') {
      return value; // Nothing to do.
    }
    if (typeof value[methods.toPlain] === 'function') {
      value = value[methods.toPlain]();
    } else if (typeof value.toJSON === 'function') {
      value = value.toJSON();
    }
    if (recursive) {
      if (Array.isArray(value)) {
        return value.map(item => utilities.plain(item));
        //
      } else if (utilities.type(value) === 'Object') {
        let result = {};

        for (const [key, item] of Object.entries(value)) {
          result[key] = utilities.plain(item);
        }
        return result;
      }
    }
    return value;
  },

  flat: (value, path = '', separator = '.', clearUndefined = false, result = {}) => {
    if (value && typeof value[methods.toFlat] === 'function') {
      value = value[methods.toFlat]();
    } else if (value && typeof value.toJSON === 'function') {
      value = value.toJSON();
    }
    if (utilities.type(value) === 'Object') {
      for (const [key, item] of Object.entries(value)) {
        utilities.flat(item, path ? `${path}${separator}${key}` : key, separator, clearUndefined, result);
      }
    } else if (!clearUndefined || typeof value !== 'undefined') {
      if (path === '') {
        result = value;
      } else {
        result[path] = value;
      }
    }
    return result;
  },

  match: (value, condition = {}, data = {}, separator = '.', errors) => {
    let result = true; // Initialize.
    const flat = utilities.plain(utilities.flat(value, '', separator));

    if (typeof condition !== 'object'){
      return condition === flat;
    }
    const keys = Object.keys(condition);

    for (const key of keys){
      if (condition[key] !== flat[key]){
        if (typeof condition[key] === 'string' && condition[key].startsWith('$')){
          const realCondition = utilities.get(data, condition[key].substring(1), undefined, separator);
          if (realCondition === flat[key] && key in flat) break;
        }
        let arrayEq = false;

        if (Array.isArray(condition[key]) && Array.isArray(flat[key]) && condition[key].length === flat[key].length){
          arrayEq = true;

          for (let i = 0; i < condition[key].length; i++){
            if (!utilities.match(flat[key][i], condition[key][i], data, separator)){
              arrayEq = false;
              break;
            }
          }
        }
        if (!arrayEq) {
          if (errors) {
            errors.push(key);
          }
          result = false;
        }
      }
    }
    return result;
  },

  isPrototypePollutionProp: (prop) => {
    return ['__proto__', 'constructor', 'prototype'].includes(prop);
  }
};

/**
 * @deprecated use utils.plain;
 */
utilities.toPlain = utilities.plain;

/**
 * @deprecated use utils.flat
 */
utilities.toFlat = utilities.flat;

/**
 * @deprecated use methods.toPlain
 */
utilities.toPlainMethod = methods.toPlain;

/**
 * @deprecated use methods.toFlat
 */
utilities.toFlatMethod = methods.toFlat;

/**
 * Module exports.
 */
module.exports = utilities;
