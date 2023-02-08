/**
 * Imports.
 */
const methods = require('./methods.js');

/**
 * Utilities.
 */
const u = {
	/**
	 * Tests equality.
	 *
	 * @param {*} valueA A value to compare.
	 * @param {*} valueB B value to compare.
	 *
	 * @returns {boolean} True if values are equal.
	 */
	equals: function (valueA, valueB) {
		return valueA === valueB;
	},

	/**
	 * Gets a value’s object type.
	 *
	 * @param {*} value Value of which to get object type.
	 *
	 * @returns {string} Object type; e.g., Null, Undefined, String, Number, Object, etc.
	 */
	type: function (value) {
		if (null === value) {
			return 'Null';
		}
		if (undefined === value) {
			return 'Undefined';
		}
		if (!value.__proto__) {
			return 'Object'; // Plain object type.
		}
		return Object.getPrototypeOf(value).constructor.name;
	},

	/**
	 * Gets a value’s object types.
	 *
	 * @param {*} value Value of which to get object types.
	 *
	 * @returns {string[]} Object types; e.g., [Null, Undefined, String, Number, Object, etc].
	 */
	types: (value) => {
		let set = new Set();

		if (null === value) {
			set.add('Null');

		} else if (undefined === value) {
			set.add('Undefined');

		} else if (!value.__proto__) {
			set.add('Object'); // Plain object type.

		} else /* Recursive. */ {
			function getClassNames(value) {
				if (value && value.constructor?.name) {
					set.add(value.constructor.name);
					getClassNames(Object.getPrototypeOf(value));
				}
			}
			getClassNames(Object.getPrototypeOf(value));
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
	 * Checks if value is the language type of Object.
	 * @see https://lodash.com/docs/4.17.15#isObject
	 *
	 * @param {*} value Value to test.
	 *
	 * @returns {boolean} True if language type of Object.
	 */
	isObject: (value) => {
		return null !== value && ['object', 'function'].includes(typeof value);
	},

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
	 * Splits an object property path notation into an array of parts.
	 *
	 * @param {string|number|Array<string|number>} path Object property path.
	 * @param {string} separator Separator used in object property path notation. Default is `.`.
	 *
	 * @returns {Array<string|number>} Object property path parts.
	 */
	splitPath: (path, separator = '.') => {
		if (typeof path === 'number') {
			path = [path]; // Array index.

		} else if (typeof path === 'string' && /^\[[0-9]+\]$/u.test(path)) {
			path = [Number(path.slice(1, -1))]; // Array index.

		} else if (typeof path === 'string') {
			if (path.startsWith(separator)) {
				path = path.slice(separator.length);
			}
			if (path.endsWith(separator)) {
				path = path.slice(0, -separator.length);
			}
			const regExp = new RegExp('(' + separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '|\[[0-9]+\])');
			path = path.split(regExp).filter((v) => '' !== v && separator !== v).map((pathPart) => {
				return /^\[[0-9]+\]$/u.test(pathPart) ? Number(pathPart.slice(1, -1)) : pathPart;
			});
		}
		if (!Array.isArray(path)) {
			throw new Error('Invalid object path notation.');
		}
		return path;
	},

	/**
	 * Gets a path’s value from a node.
	 *
	 * @param {*} node Node to search for path in.
	 * @param {string|number|Array<string|number>} path Path in node.
	 * @param {*} defaultValue Default value if path in node is undefined.
	 * @param {string} separator Separator used in path notation. Default is `.`.
	 *
	 * @returns {*} Path’s value in node; else `defaultValue`.
	 */
	get: (node, path, defaultValue = undefined, separator = '.') => {
		if (node && u.isObject(node)) {
			if (typeof node[methods.toOperation] === 'function') {
				node = node[methods.toOperation]();
			} else if (typeof node.toJSON === 'function') {
				node = node.toJSON();
			}
		}
		if (undefined === node) {
			return defaultValue;
		}
		if (typeof path === 'number') {
			path = [path];
		} else if (typeof path === 'string') {
			path = u.splitPath(path, separator);
		}
		if (!Array.isArray(path)) {
			throw new Error('Invalid object path notation.');
		}
		if (0 === path.length) {
			return node; // End of the line.
		}
		if (!node || !u.isObject(node)) {
			return defaultValue; // Should, but can't go further.
		}
		return u.get(node[path[0]], path.slice(1), defaultValue, separator);
	},

	/**
	 * {@see u.set()} with `keepExisting=true`.
	 *
	 * @note {@see u.set()} for further details.
	 *
	 * @returns {*} Revised end-of-path node.
	 */
	defaultTo: (node, path, value, separator = '.') => {
		return u.set(node, path, value, true, separator);
	},

	/**
	 * Set a path’s value within a node.
	 *
	 * @param {*} node Node to set path value in.
	 * @param {string|number|Array<string|number>} path Path in node.
	 * @param {*} value Value of the path within node that's being set.
	 *
	 * @param {boolean} keepExisting Default is `false`. Whether to override existing value.
	 *                               If `keepExisting` is passed as a string, it's used as `separator`.
	 *
	 * @param {string} separator     Separator used in path notation. Default is `.`.
	 *                               If `keepExisting` is passed as a string, it's used as `separator`.
	 *
	 * @returns {*} Revised end-of-path node.
	 */
	set: (node, path, value, keepExisting = false, separator = '.') => {
		if (node && u.isObject(node)) {
			if (typeof node[methods.toOperation] === 'function') {
				node = node[methods.toOperation]();
			} else if (typeof node.toJSON === 'function') {
				node = node.toJSON();
			}
		}
		if(!node || !u.isObject(node)) {
			return node; // Nothing more to do.
		}
		if (typeof path === 'number') {
			path = [path]; // Array index.
		} else if (typeof path !== 'string' && !Array.isArray(path)) {
			throw new Error('Invalid object path notation.');
		}
		if (!path /* '0' ok. */ || !path.length) {
			return node; // Nothing more to do.
		}
		if (typeof keepExisting === 'string') {
			separator = keepExisting, keepExisting = false;
		}
		if (typeof path === 'string' /* Split and restart. */) {
			return u.set(node, u.splitPath(path, separator), value, keepExisting, separator);
		}
		const currentPath = path[0];
		const currentValue = node[currentPath]; // Potential prototype.

		if (u.isPrototypePollutionKey(currentPath)) {
			throw new Error('Denying write access to prototype pollution key.');
		}
		if (1 === path.length) {
			if (undefined === currentValue || !keepExisting) {
				node[currentPath] = value;
			}
			return currentValue;
		}
		if (undefined === currentValue) {
			node[currentPath] = {};
		}
		return u.set(node[currentPath], path.slice(1), value, keepExisting, separator);
	},

	/**
	 * Unsets a path’s value within a node.
	 *
	 * @param {*} node Node to unset path value in.
	 * @param {string|number|Array<string|number>} path Path in node.
	 * @param {string} separator Separator used in path notation. Default is `.`.
	 *
	 * @returns {*} Revised end-of-path node.
	 */
	unset: (node, path, separator = '.') => {
		if (node && u.isObject(node)) {
			if (typeof node[methods.toOperation] === 'function') {
				node = node[methods.toOperation]();
			} else if (typeof node.toJSON === 'function') {
				node = node.toJSON();
			}
		}
		if(!node || !u.isObject(node)) {
			return node; // Nothing more to do.
		}
		if (typeof path === 'number') {
			path = [path]; // Array index.
		} else if (typeof path !== 'string' && !Array.isArray(path)) {
			throw new Error('Invalid object path notation.');
		}
		if (!path /* '0' ok. */ || !path.length) {
			return node; // Nothing more to do.
		}
		if (typeof path === 'string') {
			return u.unset(node, u.splitPath(path, separator), separator);
		}
		const currentPath = path[0]; // Potential prototype.

		if (u.isPrototypePollutionKey(currentPath)) {
			throw new Error('Denying write access to prototype pollution key.');
		}
		if ('*' === currentPath /* Plain objects and arrays only. */) {
			if ('Object' === u.type(node)) {
				for (const key of Object.keys(node)) {
					delete node[key];
				}
			} else if ('Array' === u.type(node)) {
				node.splice(0, node.length);
			}
			return node;
		}
		if (path.length === 1) {
			if (Array.isArray(node)) {
				node.splice(currentPath, 1);
			} else {
				delete node[currentPath];
			}
		} else {
			if ('*' === path[1] && !['Object', 'Array'].includes(u.type(node[currentPath]))) {
				node[currentPath] = undefined; // There’s no `*` to iterate, so clearing all in this case.
			} else {
				return u.unset(node[currentPath], path.slice(1), separator);
			}
		}
		return node;
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
		let derivedValue = false; // Initialize.

		if (value && u.isObject(value)) {
			if (typeof value[methods.toFlat] === 'function') {
				(value = value[methods.toFlat]()), (derivedValue = true);
				//
			} else if (typeof value.toJSON === 'function') {
				const flatValue = value.toJSON();

				// Use JSON only if it produced an object, or in back compat. mode.
				if ('flat' === calledAs || (flatValue && u.isObject(flatValue))) {
					(value = flatValue), (derivedValue = true);
				}
			}
		}
		if ('flat' !== calledAs && value && u.isObject(value)) {
			if(Array.isArray(value)) {
				for(let i = 0; i < value.length; i++) {
					u.toFlat(value[i], '' !== path ? `${path}[${i}]` : `[${i}]`, separator, clearUndefined, calledAs, result);
				}
			} else {
				for (const [key, keyValue] of Object.entries(value)) {
					u.toFlat(keyValue, '' !== path ? `${path}${separator}${key}` : key, separator, clearUndefined, calledAs, result);
				}
			}
		} else if ('flat' === calledAs && value && 'Object' === u.type(value)) {
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
				const keyPath = path ? path + separator + key : key;

				if (!ignore.includes(keyPath) && (white.length === 0 || white.includes(keyPath))) {
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
					const keyPath = path ? path + separator + key : key;

					if (!ignore.includes(keyPath) && (white.length === 0 || white.includes(keyPath))) {
						if ('ꓺ' === separator) {
							result.$ꓺunset.push(keyPath);
						} else {
							result.$unset.push(keyPath);
						}
					}
				}
			}
		} else {
			if (!path /* '0' ok. */) {
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
		let result = true; // Initialize.

		const flat = u.toPlain(u.toFlat(value, '', separator, false, 'match' === calledAs ? 'flat' : ''), true);
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
 * Deprecations.
 */

/**
 * @deprecated Use {@see methods.toPlain}.
 */
u.toPlainMethod = methods.toPlain; // Legacy upstream alias.

/**
 * @deprecated Use {@see methods.toFlat}.
 */
u.toFlatMethod = methods.toFlat; // Legacy upstream alias.

/**
 * @deprecated Use {@see u.equals()}.
 */
u.equal = u.equals; // Named `equal` in upstream module.

/**
 * @deprecated Use {@see u.types()}.
 */
u.typeList = u.types; // Named `typeList` in upstream module.

/**
 * @deprecated Use {@see u.instanceOf()}.
 */
u.instanceof = u.hasType; // Named `instanceof` in upstream module.

/**
 * @deprecated Use {@see u.toPlain()}.
 */
u.plain = (v, r = true) => u.toPlain(v, r, 'plain'); // Named `plain` in upstream module.

/**
 * @deprecated Use {@see u.toFlat()}.
 */
u.flat = u.flatten = (v, p = '', s = '.', c = false) => u.toFlat(v, p, s, c, 'flat'); // Named `flat` in upstream module.

/**
 * @deprecated Use {@see u.isPrototypePollutionKey()}.
 */
u.isPrototypePollutionProp = u._isPrototypePollutionProp = u.isPrototypePollutionKey; // Other names for this in prior versions.

/**
 * @deprecated Use {@see u.toDiff()}.
 */
u.diff = (v, c, o) => u.toDiff(v, c, o, 'diff'); // Named `diff` in upstream module.

/**
 * @deprecated Use {@see u.matches()}.
 */
u.match = (v, c = {}, d = {}, s = '.', e = []) => u.matches(v, c, d, s, e, 'match'); // Named `match` in upstream module.

/**
 * Module exports.
 */

module.exports = u; // Utilities.
