/**
 * Methods.
 */

const methods = {
	toOperable: Symbol('toOperable'),
	toPlain: Symbol('toPlain'),
	toFlat: Symbol('toFlat'),
};

/**
 * Deprecated methods.
 */

/**
 * @deprecated Use {@see methods.toOperable}.
 */
methods.toOperation = methods.toOperable;

/**
 * Module exports.
 */

module.exports = methods;
