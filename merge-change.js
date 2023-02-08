/**
 * Imports.
 */
const methods = require('./methods.js');
const u = require('./utilities.js');

/**
 * Class constructor.
 *
 * @returns {MergeChange}
 */
function MergeChange() {
  return this; // Class instance.
}

/**
 * Creates new instance.
 *
 * @type {Function}
 * @returns {MergeChange}
 */
MergeChange.newInstance = () => new MergeChange();
MergeChange.prototype.newInstance = MergeChange.newInstance;

/**
 * Defines merge kinds.
 *
 * @type {Object}
 */
MergeChange.KINDS = {
  MERGE: 'merge',  // Deep clone.
  PATCH: 'patch',  // Change in source value.
  UPDATE: 'update' // Immutable update (new value if there are diffs).
}
MergeChange.prototype.KINDS = MergeChange.KINDS;

/**
 * Defines special method symbols.
 *
 * @type {Object}
 */
MergeChange.methods = methods;
MergeChange.prototype.methods = MergeChange.methods;

/**
 * Defines merge-change utilities.
 *
 * @type {Object}
 */
MergeChange.u = MergeChange.utils = MergeChange.utilities = u;
MergeChange.prototype.u = MergeChange.prototype.utils = MergeChange.prototype.utilities = MergeChange.u;

/**
 * Prepares a merge function.
 *
 * @param {String} kind Kind of merge.
 *
 * @returns {Function} To handle a kind of merge.
 */
MergeChange.prototype.prepareMerge = function (kind) {
  return function (...values) {
    return values.reduce((first, second) => {
        const firstType = this.u.type(first);
        const secondType = this.u.type(second);

        for (const action of [
          `merge${firstType}${secondType}`,
          `merge${firstType}Any`,
          `mergeAny${secondType}`,
          `mergeAnyAny`,
        ]) {
          if (this[action]) // Action exists?
            return this[action](first, second, kind);
        }
        throw new Error('Unsupported merge type.');
      }
    );
  }
}

/**
 * Performs a deep clone merge.
 *
 * @param {*} first
 * @param {*} second
 * @param {...*} more
 *
 * @returns {*}
 */
MergeChange.prototype.merge = MergeChange.prototype.prepareMerge(MergeChange.KINDS.MERGE);

/**
 * Performs a patch merge.
 *
 * @param {*} first
 * @param {*} second
 * @param {...*} more
 *
 * @returns {*}
 */
MergeChange.prototype.patch = MergeChange.prototype.prepareMerge(MergeChange.KINDS.PATCH);

/**
 * Performs an immutable merge.
 *
 * @param {*} first
 * @param {*} second
 * @param {...*} more
 *
 * @returns {*}
 */
MergeChange.prototype.update = MergeChange.prototype.prepareMerge(MergeChange.KINDS.UPDATE);

/**
 * Merges Array with Array.
 *
 * @param {Array} first
 * @param {Array} second
 * @param {string} kind
 *
 * @returns {Array}
 */
MergeChange.prototype.mergeArrayArray = function (first, second, kind) {
  if (this.KINDS.MERGE === kind) {
    return second.map(value => this[kind](undefined, value));
  }
  return second;
}

/**
 * Merges Object with Object.
 *
 * @param {Object} first
 * @param {Object} second
 * @param {string} kind
 *
 * @returns {Object}
 */
MergeChange.prototype.mergeObjectObject = function (first, second, kind) {
  let derivedResult = false; // Initialize.
  let hasChanged = this.KINDS.MERGE === kind;
  let result = this.KINDS.PATCH === kind ? first : {};

  const firstKeys = Object.keys(first);
  const secondKeys = new Set(Object.keys(second));
  let keyResult, operations = []; // Initialize.

  for (const key of firstKeys) {
    if (key in second /* Own or inherited in this case. */) {
      keyResult = this[kind](first[key], second[key]);
      secondKeys.delete(key);
    } else {
      keyResult = this[kind](first[key], undefined);
    }
    hasChanged = hasChanged || keyResult !== first[key];
    result[key] = keyResult; // By assignment.
  }
  for (const key of secondKeys) {
    if (this.isOperation(key)) {
      operations.push([key, second[key]]);
    } else {
      keyResult = this[kind](undefined, second[key]);
      hasChanged = hasChanged || keyResult !== first[key];
      result[key] = keyResult; // By assignment.
    }
  }
  if (operations.length) {
    if (typeof result[this.methods.toOperation] === 'function') {
      (result = result[this.methods.toOperation]()), (hasChanged = derivedResult = true);
      //
    } else if (typeof result.toJSON === 'function') {
      const resultJSONValue = result.toJSON();

      // Use JSON only if it produced an object.
      if (resultJSONValue && this.u.isObject(resultJSONValue)) {
        (result = resultJSONValue), (hasChanged = derivedResult = true);
      }
    }
    if (derivedResult && (!result || 'Object' !== this.u.type(result))) {
      throw new Error('Invalid result for operation. Requires a plain object derivation.');
    }
  }
  for (const [operation, params] of operations) {
    hasChanged = this.operation(result, operation, params) || hasChanged;
  }
  return hasChanged ? result : first;
}

/**
 * Merges Undefined with RegExp.
 *
 * @param {undefined} first
 * @param {Date} second
 * @param {string} kind
 *
 * @returns {RegExp}
 */
MergeChange.prototype.mergeUndefinedRegExp = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? new RegExp(second) : second;
}

/**
 * Merges Undefined with URL.
 *
 * @param {undefined} first
 * @param {Date} second
 * @param {string} kind
 *
 * @returns {URL}
 */
MergeChange.prototype.mergeUndefinedURL = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? new URL(second) : second;
}

/**
 * Merges Undefined with Date.
 *
 * @param {undefined} first
 * @param {Date} second
 * @param {string} kind
 *
 * @returns {Date}
 */
MergeChange.prototype.mergeUndefinedDate = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? new Date(second) : second;
}

/**
 * Merges Undefined with Set.
 *
 * @param {undefined} first
 * @param {Set} second
 * @param {string} kind
 *
 * @returns {Set}
 */
MergeChange.prototype.mergeUndefinedSet = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? new Set(second) : second;
}

/**
 * Merges Undefined with WeakSet.
 *
 * @param {undefined} first
 * @param {WeakSet} second
 * @param {string} kind
 *
 * @returns {Object|WeakSet}
 */
MergeChange.prototype.mergeUndefinedWeakSet = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? { /* Not cloneable. */ } : second;
}

/**
 * Merges Undefined with Map.
 *
 * @param {undefined} first
 * @param {Map} second
 * @param {string} kind
 *
 * @returns {Map}
 */
MergeChange.prototype.mergeUndefinedMap = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? new Map(second) : second;
}

/**
 * Merges Undefined with WeakMap.
 *
 * @param {undefined} first
 * @param {WeakMap} second
 * @param {string} kind
 *
 * @returns {Object|WeakMap}
 */
MergeChange.prototype.mergeUndefinedWeakMap = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? { /* Not cloneable. */ } : second;
}

/**
 * Merges Undefined with Array.
 *
 * @param {undefined} first
 * @param {Array} second
 * @param {string} kind
 *
 * @returns {Array}
 */
MergeChange.prototype.mergeUndefinedArray = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? this[kind]([], second) : second;
}

/**
 * Merges Undefined with ArrayBuffer.
 *
 * @param {undefined} first
 * @param {Array} second
 * @param {string} kind
 *
 * @returns {ArrayBuffer}
 */
MergeChange.prototype.mergeUndefinedArrayBuffer = function (first, second, kind) {
  if (this.KINDS.MERGE === kind) {
    const arrayBufferClone = new ArrayBuffer(second.byteLength);
    new Uint8Array(arrayBufferClone).set(new Uint8Array(second));
    return arrayBufferClone;
  }
  return second;
}

// @todo Clone buffers?
// @todo Clone symbols?
// @todo Clone typed arrays?

/**
 * Merges Undefined with Object.
 *
 * @param {undefined} first
 * @param {Object} second
 * @param {string} kind
 *
 * @returns {Object}
 */
MergeChange.prototype.mergeUndefinedObject = function (first, second, kind) {
  return this.KINDS.MERGE === kind ? this[kind]({}, second) : this[kind](second, this.extractOperations(second));
}

/**
 * Merges Any with Undefined.
 *
 * @param {*} first
 * @param {undefined} second
 * @param {string} kind
 *
 * @returns {*}
 */
MergeChange.prototype.mergeAnyUndefined = function (first, second, kind) {
  if (first && this.u.isObject(first)) {
    if (!this['mergeUndefined' + this.u.type(first)]) {
      first = this.u.toPlain(first);
    }
    return this[kind](undefined, first);
  }
  return first;
}

/**
 * Merges Undefined with Any.
 *
 * @param {undefined} first
 * @param {*} second
 * @param {string} kind
 *
 * @returns {*}
 */
MergeChange.prototype.mergeUndefinedAny = function (first, second, kind) {
  if (second && this.u.isObject(second)) {
    if (!this['mergeUndefined' + this.u.type(second)]) {
      second = this.u.toPlain(second);
    }
    return this[kind](undefined, second);
  }
  return second;
}

/**
 * Merges Any with Any.
 *
 * @param {*} first
 * @param {*} second
 * @param {string} kind
 *
 * @returns {*}
 */
MergeChange.prototype.mergeAnyAny = function (first, second, kind) {
  if (second && this.u.isObject(second)) {
    if (!this['mergeUndefined' + this.u.type(first)]) {
      first = this.u.toPlain(first);
    }
    if (!this['mergeUndefined' + this.u.type(second)]) {
      second = this.u.toPlain(second);
    }
    if (this['merge' + this.u.type(first) + this.u.type(second)]) {
      return this[kind](first, second);
    }
  }
  return this[kind](undefined, second);
}

/**
 * Checks if a declarative operation exists.
 *
 * @param {String} operation
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.isOperation = function (operation, params) {
  return Boolean(this[`operation${operation}`]);
}

/**
 * Extracts declarative operations.
 *
 * @param {*} value Mutated by reference.
 *
 * @returns {Object}
 */
MergeChange.prototype.extractOperations = function (value) {
  const result = {}; // Intialize.

  if (!value || !this.u.isObject(value)) {
    return result; // Not possible.
  }
  for (const key of Object.keys(value)) {
    if (this.isOperation(key, value[key])) {
      result[key] = value[key];
      delete value[key];
    }
  }
  return result;
}

/**
 * Executes a declarative operation.
 *
 * @param {*} source
 * @param {String} operation
 * @param {*} params
 *
 * @returns {*}
 */
MergeChange.prototype.operation = function (source, operation, params) {
  if (this[`operation${operation}`]) {
    return this[`operation${operation}`](source, params);
  }
}

/**
 * Performs declarative operation: `$set`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$set = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'set. Requires an object source.');
  }
  if (!params || !this.u.isObject(params) || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'set params. Expecting non-array object.');
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    this.u.set(source, path, values[path], separator);
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺset = function(source, params, separator = 'ꓺ') {
  return this.operation$set(source, params, separator);
}

/**
 * Performs declarative operation: `$unset`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$unset = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'unset. Requires an object source.');
  }
  if (!params || !Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'unset params. Expecting array.');
  }
  const paths = params;

  for (const path of paths) {
    this.u.unset(source, path, separator);
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺunset = function(source, params, separator = 'ꓺ') {
  return this.operation$unset(source, params, separator);
}

/**
 * Performs declarative operation: `$leave`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$leave = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'leave. Requires an object source.');
  }
  if (!params || !Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'leave params. Expecting array.');
  }
  const paths = params;
  const leadingPaths = {};

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
  if (Array.isArray(source)) {
    for (let i = source.length - 1; i >= 0; i--) {
      if (!(i in leadingPaths)) source.splice(i, 1);
    }
  } else {
    for (const key of Object.keys(source)) {
      if (!(key in leadingPaths)) {
        delete source[key];
      } else if (leadingPaths[key].length > 0 && source[key] && this.u.isObject(source[key])) {
        this.operation$leave(source[key], leadingPaths[key], separator);
      }
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺleave = function(source, params, separator = 'ꓺ') {
  return this.operation$leave(source, params, separator);
}

/**
 * Performs declarative operation: `$push`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$push = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'push. Requires an object source.');
  }
  if (!params || !this.u.isObject(params) || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'push params. Expecting non-array object.');
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    const value = values[path];
    const array = this.u.get(source, path, [], separator);

    if (!Array.isArray(array)) {
      throw new Error('Cannot push onto non-array value.');
    }
    array.push(value); // Onto stack.
    this.u.set(source, path, array, separator);
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺpush = function(source, params, separator = 'ꓺ') {
  return this.operation$push(source, params, separator);
}

/**
 * Performs declarative operation: `$pull`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$pull = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'pull. Requires an object source.');
  }
  if (!params || !this.u.isObject(params) || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'pull params. Expecting non-array object.');
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    const array = this.u.get(source, path, [], separator);
    const pullValues = Array.isArray(values[path]) ? values[path] : [values[path]];

    if (!Array.isArray(array)) {
      throw new Error('Cannot pull from non-array value.');
    }
    for (let i = array.length - 1; i >= 0; i--) {
      for (pullValue of pullValues) {
        if (this.u.equals(pullValue, array[i])) {
          array.splice(i, 1);
          break;
        }
      }
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺpull = function(source, params, separator = 'ꓺ') {
  return this.operation$pull(source, params, separator);
}

/**
 * Performs declarative operation: `$concat`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$concat = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'concat. Requires an object source.');
  }
  if (!params || !this.u.isObject(params) || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'concat params. Expecting non-array object.');
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    const value = values[path];
    let array = this.u.get(source, path, [], separator);

    if (!Array.isArray(array)) {
      throw new Error('Cannot concat onto non-array value.');
    }
    array = array.concat(value);
    this.u.set(source, path, array, separator);
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺconcat = function(source, params, separator = 'ꓺ') {
  return this.operation$concat(source, params, separator);
}

/**
 * Performs declarative operation: `$default`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 */
MergeChange.prototype.operation$default = function (source, params, separator = '.') {
  if (!source || !this.u.isObject(source)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'default. Requires an object source.');
  }
  if (!params || !this.u.isObject(params) || Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'default params. Expecting non-array object.');
  }
  const values = params;
  const paths = Object.keys(values);

  for (const path of paths) {
    if (undefined === this.u.get(source, path, undefined, separator)) {
      this.u.set(source, path, values[path], separator);
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺdefault = function(source, params, separator = 'ꓺ') {
  return this.operation$default(source, params, separator);
}

/**
 * Performs declarative operation: `$propSortOrder`.
 *
 * @param {*} source
 * @param {*} params
 *
 * @returns {Boolean}
 *
 * @note This also has the side-effect of clearing all `undefined` properties from an object,
 *       as it is not currently possible to apply proper sorting logic otherwise.
 */
MergeChange.prototype.operation$propSortOrder = function (source, params, separator = '.') {
  if (this.u.type(source) !== 'Object') {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'propSortOrder. Requires a plain object source.');
  }
  if (!params || !Array.isArray(params)) {
    throw new Error('Invalid $' + ( 'ꓺ' === separator ? 'ꓺ' : '' ) + 'propSortOrder params. Expecting array.');
  }
  const paths = params;
  const origSource = {...source};

  for (const [key] of Object.entries(source)) {
    delete source[key]; // Start clean again.
  }
  for (const path of paths) {
    const value = this.u.get(origSource, path, undefined, separator);
    if (undefined !== value) this.u.set(source, path, value, separator);
  }
  for (const [path, value] of Object.entries(this.u.toFlat(origSource, '', separator))) {
    if (undefined !== value && undefined === this.u.get(source, path, undefined, separator)) {
      this.u.set(source, path, value, separator);
    }
  }
  return paths.length > 0;
}
MergeChange.prototype.operation$ꓺpropSortOrder = function(source, params, separator = 'ꓺ') {
  return this.operation$propSortOrder(source, params, separator);
}

/**
 * Adds a custom merge type handler.
 *
 * @param {String}   type1    Type of source value.
 * @param {String}   type2    Type of secondary value.
 * @param {Function} callback Merge function: `(first: unknown, second: unknown, kind: string): unknown`.
 *                            Callback should return the resulting merged value.
 *
 * @returns {*} Previous merge callback.
 */
MergeChange.prototype.addMerge = function (type1, type2, callback) {
  if (!type1 || typeof type1 !== 'string') {
    throw new Error('Invalid merge type as position 1.');
  }
  if (!type2 || typeof type2 !== 'string') {
    throw new Error('Invalid merge type as position 2.');
  }
  if (!callback || typeof callback !== 'function') {
    throw new Error('Invalid merge callback.');
  }
  const previousCallback = this[`merge${type1}${type2}`];
  this[`merge${type1}${type2}`] = callback; // New callback.

  return previousCallback;
}

/**
 * Adds a custom declarative merge operation.
 *
 * @param {String}   name     Operation name. Must start with `$`.
 * @param {Function} callback Operation: `(source: unknown, params: unknown, separator?: string): boolean`.
 *                            Callback should return true if the operation results in changes.
 *
 * @returns {*} Previous operation callback.
 */
MergeChange.prototype.addOperation = function (name, callback) {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid operation name.');
  }
  if (!callback || typeof callback !== 'function') {
    throw new Error('Invalid operation callback.');
  }
  if (!name.startsWith('$')) {
    name = '$' + name; // Must begin with `$`.
  }
  const previousCallback = this[`operation${name}`];
  this[`operation${name}`] = callback; // New callback.

  return previousCallback;
}

/**
 * Exports module.
 */
module.exports = new MergeChange();
