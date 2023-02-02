/**
 * Imports.
 */
const utils = require('./utils.js');
const methods = require('./methods.js');

/**
 * Class.
 *
 * @constructor
 * @returns {MergeChange}
 */
function MergeChange() {
  return this;
}

/**
 * Kinds of merges.
 *
 * @type {object}
 */
MergeChange.KINDS = {
  MERGE: 'merge',  // Deep clone.
  PATCH: 'patch',  // Change in source value.
  UPDATE: 'update' // Immutable update (new value if there are diffs).
}
MergeChange.prototype.KINDS = MergeChange.KINDS;

/**
 * Factory method. Looks for suitable methods for type merging.
 * Closure on merge kind to handle any number of values.
 *
 * @param kind {String} Kind of merge from KINDS.
 *
 * @returns Closure.
 */
MergeChange.prototype.prepareMerge = function (kind) {
  return (...values) => {
    return values.reduce((first, second) => {
        const firstType = utils.type(first);
        const secondType = utils.type(second);

        const actions = [
          `merge${firstType}${secondType}`,
          `merge${firstType}Any`,
          `mergeAny${secondType}`,
          `mergeAnyAny`,
        ];
        for (const action of actions) {
          if (this[action]) {
            return this[action](first, second, kind);
          }
        }
        return first;
      }
    );
  }
}

/**
 * Merge with cloning.
 *
 * @param first {*}
 * @param second {*}
 * @param more {...*}
 *
 * @returns {*}
 */
MergeChange.prototype.merge = MergeChange.prototype.prepareMerge(MergeChange.KINDS.MERGE);

/**
 * Merging patches.
 *
 * @param first {*}
 * @param second {*}
 * @param more {...*}
 *
 * @returns {*}
 */
MergeChange.prototype.patch = MergeChange.prototype.prepareMerge(MergeChange.KINDS.PATCH);

/**
 * Immutable merge.
 *
 * @param first {*}
 * @param second {*}
 * @param more {...*}
 *
 * @returns {*}
 */
MergeChange.prototype.update = MergeChange.prototype.prepareMerge(MergeChange.KINDS.UPDATE);

/**
 * Merge Any with Any.
 *
 * @todo On kind "merge" clone first argument?
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {*}
 */
MergeChange.prototype.mergeAnyAny = function (first, second, kind) {
  return this[kind](undefined, second);
}

/**
 * Merge Any with undefined.
 *
 * @todo On kind "merge" clone first argument?
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {*}
 */
MergeChange.prototype.mergeAnyUndefined = function (first, second, kind) {
  return this[kind](undefined, first);
}

/**
 * Merge undefined with any types.
 *
 * @todo On kind "merge" clone second argument?
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {*}
 */
MergeChange.prototype.mergeUndefinedAny = function (first, second, kind) {
  return second;
}

/**
 * Merge undefined with Date.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Date}
 */
MergeChange.prototype.mergeUndefinedDate = function (first, second, kind) {
  return kind === MergeChange.KINDS.MERGE ? new Date(second) : second;
}

/**
 * Merge undefined with Set.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Set}
 */
MergeChange.prototype.mergeUndefinedSet = function (first, second, kind) {
  return kind === MergeChange.KINDS.MERGE ? new Set(second) : second;
}

/**
 * Merge undefined with Map.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Map}
 */
MergeChange.prototype.mergeUndefinedMap = function (first, second, kind) {
  return kind === MergeChange.KINDS.MERGE ? new Map(second) : second;
}

/**
 * Merge undefined with WeekSet.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {WeekSet}
 */
MergeChange.prototype.mergeUndefinedWeekSet = function (first, second, kind) {
  return kind === MergeChange.MERGE ? new WeakSet(second) : second;
}

/**
 * Merge undefined with WeekMap.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {WeekMap}
 */
MergeChange.prototype.mergeUndefinedWeekMap = function (first, second, kind) {
  return kind === MergeChange.KINDS.MERGE ? new WeakMap(second) : second;
}

/**
 * Merge undefined with array.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Array}
 */
MergeChange.prototype.mergeUndefinedArray = function (first, second, kind) {
  return kind === MergeChange.KINDS.MERGE ? this.mergeArrayArray([], second, kind) : second;
}

/**
 * Merge undefined with plain object.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Object}
 */
MergeChange.prototype.mergeUndefinedObject = function (first, second, kind) {
  const operations = this.extractOperations(second);
  return this.mergeObjectObject(second, operations, kind);
}

/**
 * Merge plain object with plain object.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Object}
 */
MergeChange.prototype.mergeObjectObject = function (first, second, kind) {
  let result = kind === MergeChange.KINDS.PATCH ? first : {};
  let isChange = kind === MergeChange.KINDS.MERGE;

  const keysFirst = Object.keys(first);
  const keysSecond = new Set(Object.keys(second));

  let resultField, operations = [];

  for (const key of keysFirst) {
    if (key in second) {
      resultField = this[kind](first[key], second[key]);
      keysSecond.delete(key);
    } else {
      resultField = this[kind](first[key], undefined);
    }
    isChange = isChange || resultField !== first[key];
    result[key] = resultField;
  }

  // Declarative operations.
  for (const key of keysSecond) {
    if (this.isOperation(key)) {
      operations.push([key, second[key]]);
    } else {
      resultField = this[kind](undefined, second[key]);
      isChange = isChange || resultField !== first[key];
      result[key] = resultField;
    }
  }

  // Execute declarative operations.
  for (const [operation, params] of operations) {
    isChange = this.operation(result, operation, params) || isChange;
  }
  return isChange ? result : first;
}

/**
 * Merge array with array.
 *
 * Replace arrays - returns second argument.
 * On kind "merge" we clone second argument.
 *
 * @param first
 * @param second
 * @param kind
 *
 * @returns {Array}
 */
MergeChange.prototype.mergeArrayArray = function (first, second, kind) {
  if (kind === MergeChange.KINDS.MERGE) {
    return second.map(item => this[kind](undefined, item));
  }
  return second;
}

/**
 * Checking if a declarative operation exists.
 *
 * @param operation
 * @param [params]
 *
 * @returns {boolean}
 */
MergeChange.prototype.isOperation = function (operation, params) {
  return Boolean(this[`operation${operation}`]);
}

/**
 * Extract operations from object.
 *
 * @param object
 *
 * @returns {Object}
 */
MergeChange.prototype.extractOperations = function (object) {
  let result = {};
  const keys = Object.keys(object);

  for (const key of keys) {
    if (this.isOperation(key, object[key])) {
      result[key] = object[key];
      delete object[key];
    }
  }
  return result;
}

/**
 * Execute declarative operation.
 *
 * @param source
 * @param operation
 * @param params
 *
 * @returns {*}
 */
MergeChange.prototype.operation = function (source, operation, params) {
  if (this[`operation${operation}`]) {
    return this[`operation${operation}`](source, params);
  }
}

/**
 * Operation: `$set`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$set = function (source, params, separator = '.') {
  if (source && typeof source[methods.toOperation] === 'function') {
    source = source[methods.toOperation]();
  } else if (source && typeof source.toJSON === 'function') {
    source = source.toJSON();
  }
  const fieldNames = Object.keys(params);

  for (const fieldName of fieldNames) {
    utils.set(source, fieldName, params[fieldName], undefined, separator);
  }
  return fieldNames.length > 0;
}
MergeChange.prototype.operation$ꓺset = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$set(source, params, separator);
}

/**
 * Operation: `$unset`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$unset = function (source, params, separator = '.') {
  if (Array.isArray(params)) {
    if (source && typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (source && typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
    for (const fieldName of params) {
      utils.unset(source, fieldName, separator);
    }
    return params.length > 0;
  }
  return false;
}
MergeChange.prototype.operation$ꓺunset = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$unset(source, params, separator);
}

/**
 * Operation: `$leave`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$leave = function (source, params, separator = '.') {
  if (Array.isArray(params)) {
    if (source && typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (source && typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
    const names = {};

    for (const param of params) {
      let name = param;
      let subPath = '';

      if (typeof param === 'string') {
        [name, subPath] = param.split(separator);
      }
      if (!names[name]) {
        names[name] = [];
      }
      if (subPath) {
        names[name].push(subPath);
      }
    }
    const type = utils.type(source);

    if (type === 'Object') {
      const keys = Object.keys(source);

      for (const key of keys) {
        if (!names[key]) {
          delete source[key];
        } else if (names[key].length > 0) {
          this.operation$leave(source[key], names[key], separator);
        }
      }
    } else if (type === 'Array') {
      for (let key = source.length - 1; key >= 0; key--) {
        if (!(key in names)) {
          source.splice(key, 1);
        }
      }
    }
    return params.length > 0;
  }
  return false;
}
MergeChange.prototype.operation$ꓺleave = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$leave(source, params, separator);
}

/**
 * Operation: `$push`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$push = function (source, params, separator = '.') {
  if (source && typeof source[methods.toOperation] === 'function') {
    source = source[methods.toOperation]();
  } else if (source && typeof source.toJSON === 'function') {
    source = source.toJSON();
  }
  const paths = Object.keys(params);

  for (const path of paths) {
    const value = params[path];
    const array = utils.get(source, path, [], separator);

    if (Array.isArray(array)) {
      array.push(value);
      utils.set(source, path, array, undefined, separator);
    } else {
      throw new Error('Cannot push on not array.');
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺpush = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$push(source, params, separator);
}

/**
 * Operation: `$pull`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$pull = function (source, params, separator = '.') {
  if (source && typeof source[methods.toOperation] === 'function') {
    source = source[methods.toOperation]();
  } else if (source && typeof source.toJSON === 'function') {
    source = source.toJSON();
  }
  const paths = Object.keys(params);

  for (const path of paths) {
    const array = utils.get(source, path, [], separator);
    const conds = Array.isArray(params[path]) ? params[path] : [params[path]];

    if (Array.isArray(array)) {
      for (let i = array.length - 1; i >= 0; i--) {
        for(cond of conds) {
          if (utils.equal(cond, array[i])) {
            array.splice(i, 1);
            break;
          }
        }
      }
    } else {
      throw new Error('Cannot pull on not array.');
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺpull = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$pull(source, params, separator);
}

/**
 * Operation: `$concat`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$concat = function (source, params, separator = '.') {
  if (source && typeof source[methods.toOperation] === 'function') {
    source = source[methods.toOperation]();
  } else if (source && typeof source.toJSON === 'function') {
    source = source.toJSON();
  }
  const paths = Object.keys(params);

  for (const path of paths) {
    let value = params[path];
    let array = utils.get(source, path, [], separator);

    if (Array.isArray(array)) {
      array = array.concat(value);
      utils.set(source, path, array, undefined, separator);
    } else {
      throw new Error('Cannot concat on not array.');
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺconcat = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$concat(source, params, separator);
}

/**
 * Operation: `$default`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$default = function (source, params, separator = '.') {
  if (source && typeof source[methods.toOperation] === 'function') {
    source = source[methods.toOperation]();
  } else if (source && typeof source.toJSON === 'function') {
    source = source.toJSON();
  }
  const paths = Object.keys(params);

  for (const path of paths) {
    if (undefined === utils.get(source, path, undefined, separator)) {
      utils.set(source, path, params[path], undefined, separator);
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺdefault = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$default(source, params, separator);
}

/**
 * Operation: `$propSortOrder`.
 *
 * @param source
 * @param params
 *
 * @returns {boolean}
 */
MergeChange.prototype.operation$propSortOrder = function (source, params, separator = '.') {
  if (Array.isArray(params)) {
    if (source && typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (source && typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
    const paths = params;
    const origSource = {...source};

    for (const [prop] of Object.entries(source)) {
      delete source[prop]; // Start clean again.
    }
    for (const path of paths) {
      const value = utils.get(origSource, path, undefined, separator);
      if (undefined !== value) utils.set(source, path, value, undefined, separator);
    }
    for (const [path, value] of Object.entries(utils.flat(origSource, '', separator))) {
      if (undefined !== value && undefined === utils.get(source, path, undefined, separator)) {
        utils.set(source, path, value, undefined, separator);
      }
    }
    return paths.length > 0;
  }
  return false;
}
MergeChange.prototype.operation$ꓺpropSortOrder = function(source, params, separator = 'ꓺ') {
  return MergeChange.prototype.operation$propSortOrder(source, params, separator);
}

/**
 * Add custom merge method.
 *
 * @param type1 {String} Type of source value.
 * @param type2 {String} Type of secondary value.
 * @param callback {Function} Merge function with argument: (first, second, kind).
 *
 * @returns {*} The previous merge method with name `merge${type1}${type2}`.
 */
MergeChange.prototype.addMerge = function (type1, type2, callback) {
  const previous = MergeChange.prototype[`merge${type1}${type2}`];
  MergeChange.prototype[`merge${type1}${type2}`] = callback;
  return previous;
}

/**
 * Add custom declarative operation.
 *
 * @param name {String} Operation name.
 * @param callback {Function} Operation: (source, params) => boolean.
 *
 * @returns {*} The previous operation method with `$name`.
 */
MergeChange.prototype.addOperation = function (name, callback) {
  if (!name.startsWith('$')) {
    name = '$' + name;
  }
  const previous = MergeChange.prototype[`operation${name}`];
  MergeChange.prototype[`operation${name}`] = callback;
  return previous;
}

/**
 * Module exports.
 */
module.exports = new MergeChange();
