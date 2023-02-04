/**
 * Imports.
 */
const methods = require('./methods.js');

/**
 * Utilities.
 */
const u = {
	/**
	 * Checks if setting a specific property name would alter an object’s prototype.
	 *
	 * @param prop {string} Specific property name to check.
	 *
	 * @returns {boolean} True if setting the property name would alter an object’s prototype.
	 */
	_isPrototypePollutionProp: (prop) => {
		prop = (typeof prop === 'string' ? prop : '').toLowerCase();
		return ['__proto__', 'prototype', 'constructor'].includes(prop);
	},

	/**
	 * Get a property from an object.
	 *
	 * @param obj {object} Object to get property from.
	 * @param path {string|number|Array<string|number>} Property path.
	 * @param defaultValue {*} Default value if property is undefined.
	 * @param separator {string} Separator used in string path notation. Default is `.`.
	 *
	 * @returns {*} Property value; else default value.
	 */
	get: (obj, path, defaultValue = undefined, separator = '.') => {
		if (obj && typeof obj === 'object') {
			if (typeof obj[methods.toOperation] === 'function') {
				obj = obj[methods.toOperation]();
			} else if (typeof obj.toJSON === 'function') {
				obj = obj.toJSON();
			}
		}
		if (typeof obj === 'undefined') {
			return defaultValue;
		}
		if (typeof path === 'string') {
			path = u.splitPath(path, separator);
		}
		if (typeof path === 'number') {
			path = [path];
		}
		if (!Array.isArray(path)) {
			throw new Error('Invalid object path.');
		}
		if (0 === path.length) {
			return obj; // End of the line; return what we have.
		}
		if (!obj || typeof obj !== 'object') {
			return defaultValue; // Should, but can't go any further.
		}
		return u.get(obj[path[0]], path.slice(1), defaultValue, separator);
	},

	/**
	 * {@see u.set()} with `keepExisting=true`.
	 *
	 * @note {@see u.set()} for further details regarding parameters.
	 *
	 * @returns {object} Revised end-of-path object.
	 */
	setDefault: (obj, path, value, separator = '.') => {
		return u.set(obj, path, value, true, separator);
	},

	/**
	 * Set a property in an object.
	 *
	 * @param obj {object} Object to set property in.
	 * @param path {string|number|Array<string|number>} Property path.
	 * @param value {*} Value of the property that's being set in the object.
	 *
	 * @param keepExisting {boolean} Default is `false`. Whether to override existing value.
	 *                               If `keepExisting` is passed as a string, it's used as `separator`.
	 *
	 * @param separator {string}     Separator used in string path notation. Default is `.`.
	 *                               If `keepExisting` is passed as a string, it's used as `separator`.
	 *
	 * @returns {object} Revised end-of-path object.
	 */
	set: (obj, path, value, keepExisting = false, separator = '.') => {
		if (obj && typeof obj === 'object') {
			if (typeof obj[methods.toOperation] === 'function') {
				obj = obj[methods.toOperation]();
			} else if (typeof obj.toJSON === 'function') {
				obj = obj.toJSON();
			}
		}
		if(!obj || typeof obj !== 'object') {
			return typeof obj !== 'undefined' ? obj : undefined;
		}
		if (typeof path === 'number') {
			path = [path]; // Array index.
		}
		if (typeof path !== 'string' && !Array.isArray(path)) {
			throw new Error('Invalid object path.');
		}
		if (!path || !path.length) {
			return obj; // Nothing more to do.
		}
		if (typeof keepExisting === 'string') {
			separator = keepExisting, keepExisting = false;
		}
		if (typeof path === 'string') {
			return u.set(obj, u.splitPath(path, separator), value, keepExisting, separator);
		}
		const currentPath = path[0];
		const currentValue = obj[currentPath]; // Potential prototype.

		if (u._isPrototypePollutionProp(currentPath)) {
			throw new Error('Denying write access to prototype prop.');
		}
		if (1 === path.length) {
			if (undefined === currentValue || !keepExisting) {
				obj[currentPath] = value;
			}
			return currentValue;
		}
		if (undefined === currentValue) {
			obj[currentPath] = {};
		}
		return u.set(obj[currentPath], path.slice(1), value, keepExisting, separator);
	},

	/**
	 * Unsets one or more properties in an object.
	 *
	 * @param obj {object} Object to unset property in.
	 * @param path {string|number|Array<string|number>} Property path.
	 * @param separator {string} Separator used in string path notation. Default is `.`.
	 *
	 * @returns {object} Revised end-of-path object.
	 */
	unset: (obj, path, separator = '.') => {
		if (obj && typeof obj === 'object') {
			if (typeof obj[methods.toOperation] === 'function') {
				obj = obj[methods.toOperation]();
			} else if (typeof obj.toJSON === 'function') {
				obj = obj.toJSON();
			}
		}
		if(!obj || typeof obj !== 'object') {
			return typeof obj !== 'undefined' ? obj : undefined;
		}
		if (typeof path === 'number') {
			path = [path]; // Array index.
		}
		if (typeof path !== 'string' && !Array.isArray(path)) {
			throw new Error('Invalid object path.');
		}
		if (!path || !path.length) {
			return obj; // Nothing more to do.
		}
		if (typeof path === 'string') {
			return u.unset(obj, u.splitPath(path, separator), separator);
		}
		const currentPath = path[0]; // Potential prototype.

		if (u._isPrototypePollutionProp(currentPath)) {
			throw new Error('Denying write access to prototype prop.');
		}
		if ('*' === currentPath) {
			const type = u.type(obj); // Object type.

			if ('Object' === type) {
				for (const key of Object.keys(obj)) {
					delete obj[key];
				}
			} else if ('Array' === type) {
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
			const type = u.type(obj[currentPath]);

			if ('*' === path[1] && 'Object' !== type && 'Array' !== type ) {
				obj[currentPath] = undefined;
			} else {
				return u.unset(obj[currentPath], path.slice(1), separator);
			}
		}
		return obj;
	},

	/**
	 * Flattens a value into string paths with a single dimension.
	 *
	 * @param value {*} Value to flatten.
	 * @param path {string} Leading path to use as a prefix. Default is ``.
	 * @param separator {string} Separator used in string path notation. Default is `.`.
	 * @param clearUndefined {boolean} Clear undefined values? Default is `false`.
	 * @param result {*} For private internal recursive use only.
	 *
	 * @returns {*} Flattened value.
	 */
	flatten: (value, path = '', separator = '.', clearUndefined = false, result = {}) => {
		if (value && typeof value === 'object') {
			if (typeof value[methods.toFlat] === 'function') {
				value = value[methods.toFlat]();
			} else if (typeof value.toJSON === 'function') {
				value = value.toJSON();
			}
		}
		if (u.type(value) === 'Object') {
			for (const [key, item] of Object.entries(value)) {
				u.flatten(item, path ? `${path}${separator}${key}` : key, separator, clearUndefined, result);
			}
		} else if (typeof value !== 'undefined' || !clearUndefined) {
			if ('' === path) {
				result = value;
			} else {
				result[path] = value;
			}
		}
		return result;
	},

	/**
	 * Compares two values and computes differences.
	 *
	 * @param value {*} Source value.
	 * @param compare {*} Comparison value.
	 * @param options {object} Options (all optional). Default separator is `.`.
	 * @param result {*} For private internal recursive use only.
	 *
	 * @returns {object} Differences described by declarative operations using `$set|$unset`.
	 */
	diff: (value, compare, { ignore = [], separator = '.', white = [], path = '', equal = u.equals }, result) => {
		result ??= 'ꓺ' === separator ? { $ꓺset: {}, $ꓺunset: [] } : { $set: {}, $unset: [] };

		const valuePlain = u.plain(value, false);
		const comparePlain = u.plain(compare, false);

		const valueType = u.type(valuePlain);
		const compareType = u.type(comparePlain);

		if ('Object' === valueType && valueType === compareType) {
			const valueKeys = Object.keys(valuePlain);
			const compareKeys = Object.keys(comparePlain);

			for (const key of compareKeys) {
				const p = String(path) ? String(path) + separator + key : key;

				if (!ignore.includes(p) && (white.length === 0 || white.includes(p))) {
					if (!(key in valuePlain)) {
						if ('ꓺ' === separator) {
							result.$ꓺset[p] = comparePlain[key];
						} else {
							result.$set[p] = comparePlain[key];
						}
					} else if (!equal(comparePlain[key], valuePlain[key])) {
						u.diff(valuePlain[key], comparePlain[key], { ignore, separator, white, path: p, equal }, result);
					}
				}
			}
			for (const key of valueKeys) {
				if (!(key in comparePlain)) {
					const p = String(path) ? String(path) + separator + key : key;

					if (!ignore.includes(p) && (white.length === 0 || white.includes(p))) {
						if ('ꓺ' === separator) {
							result.$ꓺunset.push(p);
						} else {
							result.$unset.push(p);
						}
					}
				}
			}
		} else {
			if (!path) {
				result = compare; // Verbatim.
			} else {
				if (!ignore.includes(path) && (white.length === 0 || white.includes(path))) {
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
	 * Converts to a plain value.
	 *
	 * @param value {*} Value to convert to a plain value.
	 * @param recursive {boolean} Convert recursively? Default is `true`.
	 *
	 * @returns {*} Converted value. Now a plain value.
	 */
	plain(value, recursive = true) {
		if (!value || typeof value !== 'object') {
			return value; // Nothing to do.
		}
		if (typeof value[methods.toPlain] === 'function') {
			value = value[methods.toPlain]();
		} else if (typeof value.toJSON === 'function') {
			value = value.toJSON();
		}
		if (recursive) {
			if (Array.isArray(value)) {
				return value.map((item) => u.plain(item));
				//
			} else if (u.type(value) === 'Object') {
				let result = {}; // Initialize.

				for (const [key, item] of Object.entries(value)) {
					result[key] = u.plain(item);
				}
				return result;
			}
		}
		return value;
	},

	/**
	 * Checks if properties in an object match a set of conditions.
	 *
	 * @param value {*|object} The value to be checked, which must be an object containing `conditions` in order to match.
	 * @param conditions {*|object} The desired object with all properties that should be in an object `value`.
	 *
	 * @param data {object} Data to be substituted in the `conditions` template. Default is `{}`.
	 *                      For example '$session.user.name' in `conditions` will be replaced with `data.session.user.name`.
	 *
	 * @param separator {string} Delimiter for nested properties in `conditions`. Default is `.`.
	 *
	 * @param errors {array} If you pass an array, the names of properties for which there are no matches will be added to it.
	 *                       This is modified by reference. You can compute errors after calling this utility.
	 *
	 * @returns {boolean} True if `value` matches `conditions`.
	 */
	matches: (value, conditions = {}, data = {}, separator = '.', errors = []) => {
		let result = true; // Initialize.

		const flat = u.plain(u.flatten(value, '', separator));
		data = data && typeof data ==='object' ? data : {};

		if (!flat || !conditions
			|| typeof flat !== 'object'
			|| typeof conditions !== 'object') {
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
					const realCondition = u.get(data, conditions[key].substring('$ꓺ'.length), undefined, 'ꓺ');
					if (flat[key] === realCondition) continue;
					//
				} else if (typeof conditions[key] === 'string' && conditions[key].startsWith('$')) {
					const realCondition = u.get(data, conditions[key].substring('$'.length), undefined, separator);
					if (flat[key] === realCondition) continue;
					//
				} else if (Array.isArray(conditions[key]) && Array.isArray(flat[key]) && conditions[key].length === flat[key].length) {
					let arraysEqual = true; // Equal, thus far.
					for (i = 0; i < conditions[key].length; i++) {
						if (!u.matches(flat[key][i], conditions[key][i], data, separator, []))
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

	/**
	 * Tests equality.
	 *
	 * @param {*} valueA A value to compare.
	 * @param {*} valueB B value to compare.
	 *
	 * @returns {boolean} True if values are equal.
	 */
	equals: function (valueA, valueB) { return valueA === valueB; },

	/**
	 * Gets a value’s object type.
	 *
	 * @param value {*} Value of which to get object type.
	 *
	 * @returns {string} Object type; e.g., String, Number, Null, etc.
	 */
	type: function (value) {
		if (null === value) {
			return 'Null';
		}
		if (typeof value === 'undefined') {
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
	 * @param value {*} Value of which to get object types.
	 *
	 * @returns {string[]} Object types; e.g., String, Number, Null, etc.
	 */
	typeList(value) {
		let result = [];

		if (null === value) {
			result.push('Null');

		} else if (typeof value === 'undefined') {
			result.push('Undefined');

		} else /* Recursive. */ {
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

	/**
	 * Performs a deep `instanceof` check.
	 *
	 * @param value {*} Value to check.
	 * @param className {string} Class instance name.
	 *
	 * @returns {boolean} True if `value` is an instance of `className`.
	 */
	instanceof(value, className) {
		if (null === value) {
			return 'Null' === className;

		} else /* Recursive. */ {
			function getClass(value) {
				if (value && value.constructor) {
					return className === value.constructor.name ? true
						: getClass(Object.getPrototypeOf(value));
				}
				return false;
			}
			return getClass(Object.getPrototypeOf(value));
		}
	},

	/**
	 * Splits an object property path.
	 *
	 * @param path {string|number|Array<string|number>} Property path.
	 * @param separator {string} Separator used in string path notation. Default is `.`.
	 *
	 * @returns {Array<string|number>} Property path parts.
	 */
	splitPath: (path, separator = '.') => {
		if (typeof path === 'number') {
			path = [path]; // Array index.

		} else if (typeof path === 'string') {
			if (path.startsWith(separator)) {
				path = path.substring(separator.length);
			}
			if (path.endsWith(separator)) {
				path = path.substring(0, path.length - separator.length);
			}
			path = path.split(separator).map((name) => {
				const index = Number(name);
				return !Number.isNaN(index) && index !== null ? index : name;
			});
		}
		if (!Array.isArray(path)) {
			throw new Error('Invalid object path.');
		}
		return path;
	},
};

/**
 * Aliases.
 */

/**
 * Alias of {@see u.equals()}.
 */
u.equal = u.equals; // Named `equal` in upstream module.

/**
 * Alias of {@see u.flatten()}.
 */
u.flat = u.flatten; // Named `flat` in upstream module.

/**
 * Alias of {@see u.matches()}.
 */
u.match = u.matches; // Named `match` in upstream module.

/**
 * Deprecations.
 */

/**
 * @deprecated Use {@see u.plain()}.
 */
u.toPlain = u.plain;

/**
 * @deprecated Use {@see u.flatten()}.
 */
u.toFlat = u.flat;

/**
 * @deprecated Use {@see methods.toPlain}.
 */
u.toPlainMethod = methods.toPlain;

/**
 * @deprecated Use {@see methods.toFlat}.
 */
u.toFlatMethod = methods.toFlat;

/**
 * Module exports.
 */

module.exports = u; // Utilities.
