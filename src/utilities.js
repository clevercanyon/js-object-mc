/**
 * Imports.
 */
const methods = require('./methods.js');

const _ꓺisObject = require('lodash/isObject');
const _ꓺclone = require('lodash/clone');
const _ꓺcloneDeep = require('lodash/cloneDeep');

const structuredClone = globalThis.structuredClone || null;
const isWeb = typeof Window === 'function' && globalThis instanceof Window;

/**
 * Utilities.
 */
const u = {
	/**
	 * Gets a value’s object type.
	 *
	 * @param {*} value Value to get object type of.
	 *
	 * @returns {string} Object type; e.g., Null, Undefined, String, Number, Object, etc.
	 */
	type: function (value) {
		return u.types(value)[0];
	},

	/**
	 * Gets a value’s object types.
	 *
	 * @param {*} value Value to get object types of.
	 *
	 * @returns {string[]} Object types; e.g., [Null, Undefined, String, Number, Object, etc].
	 */
	types: (value) => {
		let collectTypes;
		let set = new Set();

		if (null === value) {
			set.add('Null');

		} else if (undefined === value) {
			set.add('Undefined');

		} else if (!value.__proto__) {
			set.add('Object'); // Plain object type.

		} else /* Recursive. */ {
			(collectTypes = (value) => {
				if (value && value.constructor?.name) {
					set.add(value.constructor.name);
					collectTypes(Object.getPrototypeOf(value));
				}
			})(Object.getPrototypeOf(value));
		}
		return Array.from(set);
	},

	/**
	 * Performs a pseudo-instanceof check using {@see u.types()}.
	 *
	 * @param {*} value Value to check {@see u.types()} of and compare to `className`.
	 * @param {string} className Class instance name to compare against {@see u.types(value)}.
	 *
	 * @returns {boolean} True if `value` is an instance of `className`.
	 */
	hasType: (value, className) => {
		return u.types(value).includes(className);
	},

	/**
	 * Tests strict equality.
	 *
	 * @param {*} valueA A value to compare.
	 * @param {*} valueB B value to compare.
	 *
	 * @returns {boolean} True if values are equal, using strict equality.
	 */
	equals: function (valueA, valueB) {
		return valueA === valueB;
	},

	/**
	 * Checks if value is the language type of Object.
	 *
	 * @param {*} value Value to test.
	 *
	 * @returns {boolean} True if value has a language type of Object.
	 *
	 * @see https://lodash.com/docs/4.17.15#isObject
	 */
	isObject: (value) => _ꓺisObject(value),

	/**
	 * Checks if setting a specific property key would alter an object’s prototype.
	 *
	 * @param {string} key Specific property key to check.
	 *
	 * @returns {boolean} True if setting the property key would alter an object’s prototype.
	 */
	isPrototypePollutionKey: (key) => {
		key = (typeof key === 'string' ? key : '').toLowerCase();
		return ['__proto__', 'prototype', 'constructor'].includes(key);
	},

	/**
	 * Clones a value; loosely based on the structured clone algorithm.
	 *
	 * @param {*} value Value to clone.
	 * @param {boolean} deep Clone value deeply? Default is `false`.
	 *
	 * @returns {*} Clone of input value.
	 *
	 * @see https://o5p.me/BTyjw8
	 * @see https://lodash.com/docs/4.17.15#clone
	 * @see https://lodash.com/docs/4.17.15#cloneDeep
	 */
	clone: (value, deep = false) => {
		const objTypes = u.types(value);

		switch (true) {
			case ('URL' === objTypes[0]):
				// Not supported by Lodash or `structuredClone()`.
				// This is an easy one, so might as well support it here.
				return new URL(value);

			case (structuredClone && objTypes.includes('Error')):
				// Not supported by Lodash, but is supported by `structuredClone()`.
				// See: <https://o5p.me/BTyjw8> for further details.
				return structuredClone(value);

			case (isWeb && structuredClone && [
				// Not supported by Lodash, but is supported by `structuredClone()`.
				// See: <https://o5p.me/BTyjw8> for further details.
				'AudioData',
				'Blob',
				'CropTarget',
				'CryptoKey',
				'DOMException',
				'DOMMatrix',
				'DOMMatrixReadOnly',
				'DOMPoint',
				'DOMPointReadOnly',
				'DOMQuad',
				'DOMRect',
				'DOMRectReadOnly',
				'File',
				'FileList',
				'FileSystemDirectoryHandle',
				'FileSystemFileHandle',
				'FileSystemHandle',
				'GPUCompilationInfo',
				'GPUCompilationMessage',
				'ImageBitmap',
				'ImageData',
				'RTCCertificate',
				'VideoFrame',
			].includes(objTypes[0])):
				return structuredClone(value);

			default: // Uses Lodash.
				return deep ? _ꓺcloneDeep(value) : _ꓺclone(value);
		}
	},

	/**
	 * Splits an object path notation into an array of parts.
	 *
	 * @param {string|number|Array<string|number>} path Object path notation.
	 * @param {string} separator Separator used in object path notation. Default is `.`.
	 *
	 * @returns {Array<string|number>} Object path parts.
	 */
	splitObjPath: (path, separator = '.') => {
		if (typeof path === 'number') {
			if (isNaN(path) || Infinity === path || path < 0) {
				throw new Error('Invalid object path notation.');
			} else {
				path = [path]; // Array index.
			}
		} else if (typeof path === 'string' && /^\[[0-9]+\]$/u.test(path)) {
			path = Number(path.slice(1, -1));

			if (isNaN(path) || Infinity === path || path < 0) {
				throw new Error('Invalid object path notation.');
			} else {
				path = [path]; // Array index.
			}
		} else if (typeof path === 'string') {
			if (path.startsWith(separator)) {
				path = path.slice(separator.length);
			}
			if (path.endsWith(separator)) {
				path = path.slice(0, -separator.length);
			}
			if (/[\[\]]/u.test(separator)) {
				throw new Error('Invalid object path notation separator. Cannot use `[` or `]`.');
			}
			const regExp = new RegExp('(' + separator.replace(/[.*+?^${}()|[\]\\]/ug, '\\$&') + '|\\[[0-9]+\\])');

			path = path.split(regExp).filter((v) => '' !== v && separator !== v).map((part) => {
				if (/^\[[0-9]+\]$/u.test(part)) {
					part = Number(part.slice(1, -1)); // Array index.

					if (isNaN(part) || Infinity === part || part < 0) {
						throw new Error('Invalid object path notation.');
					}
				}
				return part;
			});
		}
		if (!Array.isArray(path)) {
			throw new Error('Invalid object path notation.');
		}
		return path;
	},

	/**
	 * Gets an object path’s value from a node.
	 *
	 * @param {*} node Node to search for object path in.
	 * @param {string|number|Array<string|number>} path Object path in node.
	 * @param {*} defaultValue Default value if object path in node is undefined.
	 * @param {string} separator Separator used in object path notation. Default is `.`.
	 *
	 * @returns {*} Object path’s value in node; else `defaultValue`.
	 */
	get: (node, path, defaultValue = undefined, separator = '.') => {
		node = u.toOperable(node);

		if (undefined === node) {
			return defaultValue;
		}
		path = u.splitObjPath(path, separator);

		if (0 === path.length) {
			return node; // End of the line.
		}
		if (!node || !u.isObject(node)) {
			return defaultValue; // Should, but can't go further.
		}
		return u.get(node[path[0]], path.slice(1), defaultValue, separator);
	},

	/**
	 * Set an object path’s value within a node.
	 *
	 * @param {*} node Node to set object path value in.
	 * @param {string|number|Array<string|number>} path Object path in node.
	 * @param {*} value Value of the object path within node that's being set.
	 *
	 * @param {boolean} keepExisting Default is `false`. Whether to override existing value.
	 *                               If `keepExisting` is passed as a string, it's used as `separator`.
	 *
	 * @param {string} separator     Separator used in object path notation. Default is `.`.
	 *                               If `keepExisting` is passed as a string, it's used as `separator`.
	 */
	set: (node, path, value, keepExisting = false, separator = '.') => {
		node = u.toOperable(node);

		if(!node || !u.isObject(node)) {
			return; // Nothing more to do.
		}
		if (typeof keepExisting === 'string') {
			separator = keepExisting, keepExisting = false;
		}
		path = u.splitObjPath(path, separator);

		if (0 === path.length) {
			return; // Nothing more to do.
		}
		const currentPath = path[0]; // Potential prototype.
		const currentValue = node[currentPath];

		if (u.isPrototypePollutionKey(currentPath)) {
			throw new Error('Denying write access to prototype pollution key.');
		}
		if (1 === path.length) {
			if (!keepExisting || undefined === currentValue) {
				node[currentPath] = value;
			}
		} else {
			if (undefined === currentValue) node[currentPath] = {};
			u.set(node[currentPath], path.slice(1), value, keepExisting, separator);
		}
	},

	/**
	 * {@see u.set()} with `keepExisting=true`.
	 *
	 * @note {@see u.set()} for further details.
	 */
	defaultTo: (node, path, value, separator = '.') => {
		u.set(node, path, value, true, separator);
	},

	/**
	 * Unsets an object path’s value within a node.
	 *
	 * @param {*} node Node to unset object path value in.
	 * @param {string|number|Array<string|number>} path Object path in node.
	 * @param {string} separator Separator used in object path notation. Default is `.`.
	 */
	unset: (node, path, separator = '.') => {
		node = u.toOperable(node);

		if(!node || !u.isObject(node)) {
			return; // Nothing more to do.
		}
		path = u.splitObjPath(path, separator);

		if (0 === path.length) {
			return; // Nothing more to do.
		}
		const currentPath = path[0]; // Potential prototype.

		if (u.isPrototypePollutionKey(currentPath)) {
			throw new Error('Denying write access to prototype pollution key.');
		}
		if ('*' === currentPath) {
			if (Array.isArray(node)) {
				node.splice(0, node.length);
			} else {
				for (const key of Object.keys(node)) {
					delete node[key];
				}
			}
		} else if (1 === path.length) {
			if (Array.isArray(node)) {
				node.splice(currentPath, 1);
			} else {
				delete node[currentPath];
			}
		} else {
			if ('*' === path[1] && (!node[currentPath] || !u.isObject(node[currentPath]))) {
				node[currentPath] = undefined; // Nothing to iterate, so clear all in this case.
			} else {
				u.unset(node[currentPath], path.slice(1), separator);
			}
		}
	},

	/**
	 * Attempts to convert a value into an operable value.
	 *
	 * @param {*} value Value to convert to an operable value.
	 *
	 * @returns {*} Converted value. Now an operable value.
	 *
	 * @note This method intentionally does not run deep, as doing a deep conversion would cause problems.
	 *       The goal here is to expose an underlying object that's operable, and to retain any object references
	 *       from within the operable value. Running a deep conversion would break and/or overwrite references.
	 */
	toOperable: (value) => {
		if (!value || !u.isObject(value)) {
			return value; // Nothing to do.
		}
		if (typeof value[methods.toOperable] === 'function') {
			value = value[methods.toOperable]();
			//
		} else if (typeof value.toJSON === 'function') {
			const jsonValue = value.toJSON();

			// Use JSON only if it produced an object.
			if (jsonValue && u.isObject(jsonValue)) {
				value = jsonValue;
			}
		}
		return value;
	},

	/**
	 * Converts to a plain value.
	 *
	 * @param {*} value Value to convert to a plain value.
	 * @param {boolean} deep Deeply? Default is `undefined`, equating to `false`.
	 * @param {string} calledAs Internal use only. Preserves deprecated alias expectations.
	 *
	 * @returns {*} Converted value. Now a plain value.
	 */
	toPlain: (value, deep = undefined, calledAs = '') => {
		let derivedValue = false; // Initialize.

		if (!value || !u.isObject(value)) {
			return value; // Nothing to do.
		}
		if (typeof value[methods.toPlain] === 'function') {
			(value = value[methods.toPlain]()), (derivedValue = true);
			//
		} else if (typeof value.toJSON === 'function') {
			const plainValue = value.toJSON();

			// Use JSON only if it produced an object, or in back compat. mode.
			if ('plain' === calledAs || (plainValue && u.isObject(plainValue))) {
				(value = plainValue), (derivedValue = true);
			}
		}
		if (derivedValue && (!value || !u.isObject(value))) {
			return value; // Nothing more to do.
		}
		if ('plain' === calledAs && undefined === deep) {
			deep = true; // Alias expects default to be `true`.
		}
		if (deep) {
			if (value && Array.isArray(value) /* Recursively in this case. */) {
				value = value.map((keyValue) => u.toPlain(keyValue, deep, calledAs));
				//
			} else if (('plain' !== calledAs && value && u.isObject(value))
				|| ('plain' === calledAs && value && 'Object' === u.type(value)))
			{
				let result = {}; // Initialize.

				for (const [key, keyValue] of Object.entries(value)) {
					result[key] = u.toPlain(keyValue, deep, calledAs);
				}
				value = result; // Update by assignment.
			}
		} else {
			if(('plain' !== calledAs && value && u.isObject(value) && !Array.isArray(value))
				|| ('plain' === calledAs && value && 'Object' === u.type(value)))
			{
				let result = {}; // Initialize.

				for (const [key, keyValue] of Object.entries(value)) {
					result[key] = keyValue; // Not recursive here.
				}
				value = result; // Update by assignment.
			}
		}
		return value;
	},

	/**
	 * Flattens a value into string paths with a single dimension.
	 *
	 * @param {*} value Value to flatten.
	 * @param {string} path Leading path to use as a prefix. Default is ``.
	 * @param {string} separator Separator used in string path notation. Default is `.`.
	 * @param {boolean} clearUndefined Clear undefined values? Default is `false`.
	 * @param {string} calledAs Internal use only. Preserves deprecated alias expectations.
	 * @param {*} result For private internal recursive use only.
	 *
	 * @returns {*} Flattened value.
	 */
	toFlat: (value, path = '', separator = '.', clearUndefined = false, calledAs = '', result = {}) => {
		if (value && u.isObject(value)) {
			if (typeof value[methods.toFlat] === 'function') {
				value = value[methods.toFlat]();
				//
			} else if (typeof value.toJSON === 'function') {
				const flatValue = value.toJSON();

				// Use JSON only if it produced an object, or in back compat. mode.
				if ('flat' === calledAs || (flatValue && u.isObject(flatValue))) {
					value = flatValue;
				}
			}
		}
		if ('flat' !== calledAs && value && Array.isArray(value)) {
			for(let i = 0; i < value.length; i++) {
				u.toFlat(value[i], '' !== path ? `${path}[${i}]` : `[${i}]`, separator, clearUndefined, calledAs, result);
			}
		} else if (value && 'Object' === u.type(value)) {
			for (const [key, keyValue] of Object.entries(value)) {
				u.toFlat(keyValue, '' !== path ? `${path}${separator}${key}` : key, separator, clearUndefined, calledAs, result);
			}
		} else if (undefined !== value || !clearUndefined) {
			if ('' === path) {
				result = value;
			} else {
				result[path] = value;
			}
		}
		return result;
	},

	/**
	 * Compares two values and produces a diff value.
	 *
	 * @param {*} value Source value.
	 * @param {*} compare Comparison value.
	 * @param {object} options Options (all optional). Default separator is `.`.
	 * @param {string} calledAs Internal use only. Preserves deprecated alias expectations.
	 * @param {*} result For private internal recursive use only.
	 *
	 * @returns {*} Differences described by `$set|$unset` or `$ꓺset|$ꓺunset`.
	 */
	toDiff: (value, compare, { ignore = [], separator = '.', white = [], path = '', equal, equals = u.equals }, calledAs = '', result) => {
		const valuePlain = 'diff' === calledAs ? u.plain(value, false) : u.toPlain(value);
		const comparePlain = 'diff' === calledAs ? u.plain(compare, false) : u.toPlain(compare);

		path = String(path); // Enforce string path always here.
		equals = equal || equals; // Supports `equal` as an alias of `equals`.
		result ??= 'ꓺ' === separator ? { $ꓺset: {}, $ꓺunset: [] } : { $set: {}, $unset: [] };

		if ('Object' === u.type(valuePlain) && 'Object' === u.type(comparePlain)) {
			for (const key of Object.keys(comparePlain)) {
				const keyPath = '' !== path ? path + separator + key : key;

				if (!ignore.includes(keyPath) && (0 === white.length || white.includes(keyPath))) {
					if (!valuePlain.hasOwnProperty(key)) {
						if ('ꓺ' === separator) {
							result.$ꓺset[keyPath] = comparePlain[key];
						} else {
							result.$set[keyPath] = comparePlain[key];
						}
					} else if (!equals(comparePlain[key], valuePlain[key])) {
						u.toDiff(valuePlain[key], comparePlain[key], { ignore, separator, white, path: keyPath, equals }, calledAs, result);
					}
				}
			}
			for (const key of Object.keys(valuePlain)) {
				if (!comparePlain.hasOwnProperty(key)) {
					const keyPath = '' !== path ? path + separator + key : key;

					if (!ignore.includes(keyPath) && (0 === white.length || white.includes(keyPath))) {
						if ('ꓺ' === separator) {
							result.$ꓺunset.push(keyPath);
						} else {
							result.$unset.push(keyPath);
						}
					}
				}
			}
		} else {
			if ('' === path) {
				result = compare; // Verbatim.
			} else {
				if (!ignore.includes(path) && (0 === white.length || white.includes(path))) {
					if ('ꓺ' === separator) {
						result.$ꓺset[path] = compare;
					} else {
						result.$set[path] = compare;
					}
				}
			}
		}
		return result;
	},

	/**
	 * Checks if properties in an object match a set of conditions.
	 *
	 * @param {*} value The value to be checked, which must be an object containing `conditions` in order to match.
	 * @param {*} conditions The desired object with all properties that should be in an object `value`.
	 *
	 * @param {object} data Data to be substituted in the `conditions` template. Default is `{}`.
	 *                      For example '$session.user.name' in `conditions` will be replaced with `data.session.user.name`.
	 *
	 * @param {string} separator Delimiter for nested properties in `conditions`. Default is `.`.
	 *
	 * @param {array} errors If you pass an array, the names of properties for which there are no matches will be added to it.
	 *                       This is modified by reference. You can compute errors after calling this utility.
	 *
	 * @param {string} calledAs Internal use only. Preserves alias expectations.
	 *
	 * @returns {boolean} True if `value` matches `conditions`.
	 */
	matches: (value, conditions = {}, data = {}, separator = '.', errors = [], calledAs = '') => {
		let flat, result = true; // Initialize.

		if ('match' === calledAs) {
			flat = u.flat(u.plain(value), '', separator);
		} else {
			flat = u.toFlat(u.toPlain(value, true), '', separator);
		}
		data = data && u.isObject(data) ? data : {};

		if (!flat || !conditions || !u.isObject(flat) || !u.isObject(conditions)) {
			return u.equals(flat, conditions);
		}
		for (const key of Object.keys(conditions)) {
			if(!(key in flat)) {
				errors.push(key);
				result = false;
				continue;
			}
			if (conditions[key] !== flat[key]) {
				if (typeof conditions[key] === 'string' && conditions[key].startsWith('$ꓺ')) {
					const realCondition = u.get(data, conditions[key].slice('$ꓺ'.length), undefined, 'ꓺ');
					if (flat[key] === realCondition) continue;
					//
				} else if (typeof conditions[key] === 'string' && conditions[key].startsWith('$')) {
					const realCondition = u.get(data, conditions[key].slice('$'.length), undefined, separator);
					if (flat[key] === realCondition) continue;
					//
				} else if (Array.isArray(conditions[key]) && Array.isArray(flat[key]) && conditions[key].length === flat[key].length) {
					let arraysEqual = true; // Equal, thus far.
					for (i = 0; i < conditions[key].length; i++) {
						if (!u.matches(flat[key][i], conditions[key][i], data, separator, [], calledAs))
							{ arraysEqual = false; break; }
					} if(arraysEqual) continue;
				}
				errors.push(key);
				result = false;
				continue;
			}
		}
		return result;
	},
};

/**
 * Deprecated utilities.
 */

/**
 * @deprecated Use {@see u.types()}.
 */
u.typeList = u.types; // Named `typeList` in upstream module.

/**
 * @deprecated Use {@see u.instanceOf()}.
 */
u.instanceof = u.hasType; // Named `instanceof` in upstream module.

/**
 * @deprecated Use {@see u.equals()}.
 */
u.equal = u.equals; // Named `equal` in upstream module.

/**
 * @deprecated Use {@see u.isPrototypePollutionKey()}.
 */
u.isPrototypePollutionProp = u._isPrototypePollutionProp = u.isPrototypePollutionKey; // Other names for this in prior versions.

/**
 * @deprecated Use {@see u.splitObjPath()}.
 */
u.splitPath = u.splitObjPath; // Named `splitPath` in upstream module.

/**
 * @deprecated Use {@see u.toPlain()}.
 */
u.plain = (v, r = true) => u.toPlain(v, r, 'plain'); // Named `plain` in upstream module.

/**
 * @deprecated Use {@see u.toFlat()}.
 */
u.flat = u.flatten = (v, p = '', s = '.', c = false) => u.toFlat(v, p, s, c, 'flat'); // Named `flat` in upstream module.

/**
 * @deprecated Use {@see u.toDiff()}.
 */
u.diff = (v, c, o) => u.toDiff(v, c, o, 'diff'); // Named `diff` in upstream module.

/**
 * @deprecated Use {@see u.matches()}.
 */
u.match = (v, c = {}, d = {}, s = '.', e = []) => u.matches(v, c, d, s, e, 'match'); // Named `match` in upstream module.

/**
 * Deprecated methods.
 */

/**
 * @deprecated Use {@see methods.toOperable}.
 */
u.toOperableMethod = u.toOperationMethod = methods.toOperable; // Legacy upstream approach.

/**
 * @deprecated Use {@see methods.toPlain}.
 */
u.toPlainMethod = methods.toPlain; // Legacy upstream alias.

/**
 * @deprecated Use {@see methods.toFlat}.
 */
u.toFlatMethod = methods.toFlat; // Legacy upstream alias.

/**
 * Module exports.
 */

module.exports = u; // Utilities.
