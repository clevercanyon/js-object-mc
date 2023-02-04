/**
 * Imports.
 */
const methods = require('./methods.js');
const u = require('./utilities.js');

/**
 * Class.
 *
 * @constructor
 * @returns {MergeChange}
 */
function MergeChange() {
  return this; // Class instance.
}

/**
 * Kinds.
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
 * Methods.
 *
 * @type {object}
 */
MergeChange.methods = methods;
MergeChange.prototype.methods = MergeChange.methods;

/**
 * Utilities.
 *
 * @type {object}
 */
MergeChange.u = MergeChange.utils = MergeChange.utilities = u;
MergeChange.prototype.u = MergeChange.prototype.utils = MergeChange.prototype.utilities = MergeChange.u;

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
        const firstType = u.type(first);
        const secondType = u.type(second);

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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'set. Requires an object source.');
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'set params. Expecting non-array object.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    u.set(source, path, values[path], separator);
  }
  return paths.length > 0;
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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'unset. Requires an object source.');
  }
  if (!params || !Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'unset params. Expecting array.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const paths = params;

  for (const path of paths) {
    u.unset(source, path, separator);
  }
  return paths.length > 0;
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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'leave. Requires an object source.');
  }
  if (!params || !Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'leave params. Expecting array.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const leadingPaths = {};
  const paths = params;

  for (const path of paths) {
    let leadingPath = path;
    let subPath = ''; // Initialize.

    if (typeof path === 'string') {
      [leadingPath, subPath] = path.split(separator);
    }
    if (!(leadingPath in leadingPaths)) {
      leadingPaths[leadingPath] = [];
    }
    if (subPath) {
      leadingPaths[leadingPath].push(subPath);
    }
  }
  const type = u.type(source);

  if (type === 'Object') {
    for (const prop of Object.keys(source)) {
      if (!(prop in leadingPaths)) {
        delete source[prop];
      } else if (leadingPaths[prop].length > 0 && source[prop] && typeof source[prop] === 'object') {
        this.operation$leave(source[prop], leadingPaths[prop], separator);
      }
    }
  } else if (type === 'Array') {
    for (let i = source.length - 1; i >= 0; i--) {
      if (!(i in leadingPaths)) source.splice(i, 1);
    }
  }
  return paths.length > 0;
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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'push. Requires an object source.');
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'push params. Expecting non-array object.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    const value = values[path];
    const array = u.get(source, path, [], separator);

    if (!Array.isArray(array)) {
      throw new Error('Cannot push onto non-array value.');
    }
    array.push(value); // Onto stack.
    u.set(source, path, array, separator);
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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'pull. Requires an object source.');
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'pull params. Expecting non-array object.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    const array = u.get(source, path, [], separator);
    const pullValues = Array.isArray(values[path]) ? values[path] : [values[path]];

    if (!Array.isArray(array)) {
      throw new Error('Cannot pull from non-array value.');
    }
    for (let i = array.length - 1; i >= 0; i--) {
      for(pullValue of pullValues) {
        if (u.equals(pullValue, array[i])) {
          array.splice(i, 1);
          break;
        }
      }
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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'concat. Requires an object source.');
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'concat params. Expecting non-array object.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    let value = values[path];
    let array = u.get(source, path, [], separator);

    if (!Array.isArray(array)) {
      throw new Error('Cannot concat onto non-array value.');
    }
    array = array.concat(value);
    u.set(source, path, array, separator);
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
  if(!source || typeof source !== 'object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'default. Requires an object source.');
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'default params. Expecting non-array object.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    if (undefined === u.get(source, path, undefined, separator)) {
      u.set(source, path, values[path], separator);
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
  if(u.type(source) !== 'Object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'propSortOrder. Requires a plain object source.');
  }
  if (!params || !Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'propSortOrder params. Expecting array.');
  }
  if (source && typeof source === 'object') {
    if (typeof source[methods.toOperation] === 'function') {
      source = source[methods.toOperation]();
    } else if (typeof source.toJSON === 'function') {
      source = source.toJSON();
    }
  }
  const paths = params;
  const origSource = {...source};

  for (const [prop] of Object.entries(source)) {
    delete source[prop]; // Start clean again.
  }
  for (const path of paths) {
    const value = u.get(origSource, path, undefined, separator);
    if (undefined !== value) u.set(source, path, value, separator);
  }
  for (const [path, value] of Object.entries(u.flatten(origSource, '', separator))) {
    if (undefined !== value && undefined === u.get(source, path, undefined, separator)) {
      u.set(source, path, value, separator);
    }
  }
  return paths.length > 0;
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
 * @param callback {Function} Operation: (source, params, separator) => boolean.
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
