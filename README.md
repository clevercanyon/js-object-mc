# @clevercanyon/merge-change.fork

A fork of the original [merge-change](https://www.npmjs.com/package/merge-change) on NPM.
This fork has been patched to resolve a [prototype pollution security issue](https://github.com/advisories/GHSA-f9cv-665r-275h). A few things have also been added (e.g., TypeScript typings), a few things have been fixed or improved upon, while still preserving all expectations of the original module. Therefore, this works as a drop-in replacement for `merge-change`.

`merge-change` is a simple library for **deep merge** of objects and other types, also for **patches** and **immutable updates**. By default, merge works for "plain objects". Values of other types are replaced, but you can **customize merging** between specific types. Also, you can use **declarative operations** to do some very interesting things like `unset`, `leave`, `push`, `pull`, `defaults`, and others. For example to remove properties of object, to replace "plain objects", to concat arrays. Calculating diffs between two values.

## API

Dropping in as a `merge-change` replacement.

```json
"dependencies": {
	"merge-change": "npm:@clevercanyon/merge-change.fork@^1.0.0",
}
```

ES Module `import` (recommended).

```js
import mc from 'merge-change';
```

CommonJS `require()`.

```js
const mc = require('merge-change');
```

### Merge

Merge with **deep cloning** — without changing the source objects; i.e., this utility returns a deep clone. Great for creating or extending objects deeply. New instances are created deeply with all `...merges` cloned prior to being merged into preceding `source` objects.

Underneath, this uses [\_.clone() in Lodash](https://lodash.com/docs/4.17.15#clone), which supports cloning arrays, array buffers, booleans, date objects, maps, numbers, Object objects, regexes, sets, strings, symbols, and typed arrays. The own enumerable properties of arguments objects are cloned as plain objects. An empty object is returned for uncloneable values such as error objects, functions, DOM nodes, and WeakMaps.

```js
mc.merge(source, ...merges);
```

Example:

```js
import mc from 'merge-change';

let first = {
	a: {
		one: true,
		two: 2,
	},
};
let second = {
	a: {
		three: 3,
		$unset: ['one'], // $unset is a declarative operation.
	},
};
const result = mc.merge(first, second);

// Result is a new merged object clone.
console.log(result); // { a: { two: 2, three: 3} }
console.log(result !== first); // true
console.log(result !== second); // true
```

### Patch

Merge with **mutation** of the source objects, deeply. Nice for patching. New instances will not be created; i.e., each of the `...patches` are simply copied into a preceding `source` object. The `source` objects are mutated by reference, but they will not receive clones. Rather, they receive objects by reference merged in from `...patches`.

```js
mc.patch(source, ...patches);
```

```js
let first = {
	a: {
		one: true,
		two: 2,
	},
};
let second = {
	a: {
		three: 3,
		$unset: ['one'], // $unset is a declarative operation.
	},
};
const result = mc.patch(first, second);

// Result is a mutated first argument.
console.log(result); // { a: { two: 2,  three: 3} }
console.log(result === first); // true
console.log(result !== second); // true
```

### Update

**Immutable merge** - creates new instances, deeply, only if there are diffs. When new instances are created, each of the `...updates` are simply copied into a preceding `source` object. The `source` objects are mutated by reference, but they will not receive clones. Rather, they receive objects by reference merged in from `...updates`.

```js
mc.update(source, ...updates);
```

```js
let first = {
	a: {
		one: true,
		two: 2,
		sub: {
			value: 3,
		},
	},
};
let second = {
	a: {
		three: 3,
		$unset: ['one'], // $unset is a declarative operation.
	},
};
const result = mc.update(first, second);

// Result is a new object.
console.log(result); // { a: { two: 2, sub: { value: 3 }, three: 3 } }
console.log(result !== first); // true
console.log(result !== second); // true

// Object "a.sub" is unchanged.
console.log(result.a.sub === first.a.sub); // true
```

## Declarative Operations

Supported in all merge methods. When merging, patching, or updating objects, you can perform declarative operations at the same time. The syntax is similar to mongoDB. Declarative operations can be a massive time-saver supporting lots of extensibility.

### Note:

-   The use of `$` as a prefix implies the standard `.` object path separator.
    -   e.g., `$set: { 'a.b.c[0]': 'value' }` to set `{ a: { b: { c: ['value'] } } }`.
-   The use of `$ꓺ` implies the use of `ꓺ` (i.e., [`\uA4FA`](https://graphemica.com/%EA%93%BA#code)) as an object path separator.
    -   e.g., `$ꓺset: { 'aꓺbꓺc[0]': 'value' }` to set `{ a: { b: { c: ['value'] } } }`.

### `$set`, `$ꓺset`

To set (or replace) a property by name or object path.

```js
const result = mc.merge(
	{
		a: {
			one: 1,
			two: 2,
		},
	},
	{
		$set: {
			a: {
				three: 3,
			},
			'a.two': 20, // Keys can be an object path.
		},
	},
);
console.log(result);
```

Result:

```json
{
	"a": {
		"three": 3,
		"two": 20
	}
}
```

### `$unset`, `$ꓺunset`

To unset properties by name or object path.

```js
const result = mc.merge(
	{
		a: {
			one: 1,
			two: 2,
		},
	},
	{
		$unset: ['a.two'],
	},
);
console.log(result);
```

Result:

```json
{
	"a": {
		"one": 1
	}
}
```

To unset all keys use `*`.

```js
const result = mc.merge(
	{
		a: {
			one: 1,
			two: 2,
		},
	},
	{
		$unset: ['a.*'],
	},
);
console.log(result);
```

Result:

```json
{
	"a": {}
}
```

### `$leave`, `$ꓺleave`

To leave properties by name or object path. Implies all other properties should be unset.

```js
const result = mc.merge(
	{
		a: {
			one: 1,
			two: 2,
			tree: 3,
		},
	},
	{
		a: {
			$leave: ['two'],
		},
	},
);
console.log(result);
```

Result:

```json
{
	"a": {
		"two": 2
	}
}
```

### `$push`, `$ꓺpush`

To push an item **_as one value_** (be careful) onto an array. The source value must be an array.

-   To push multiple values, please see: `$concat`, `$ꓺconcat`.

```js
const result = mc.merge(
	// First object
	{
		prop1: ['a', 'b'],
		prop2: ['a', 'b'],
		prop3: ['a', 'b'],
	},
	// Merge
	{
		$push: {
			prop1: ['c', 'd'],
			prop2: { x: 'c' },
			prop3: 'c',
		},
	},
);
console.log(result);
```

Result:

```json
{
	"prop1": ["a", "b", ["c", "d"]],
	"prop2": ["a", "b", { "x": "c" }],
	"prop3": ["a", "b", "c"]
}
```

### `$pull`, `$ꓺpull`

To pull (remove) values from an array. The source value must be an array.

```js
const result = mc.merge(
	// First object
	{
		prop1: ['a', 'b', 'c', 'x'],
		prop2: ['a', 'b', 'c', 'x', 'y', 'z'],
		prop3: [1, 2, 3, 100, 200],
	},
	// Merge
	{
		$pull: {
			prop1: 'x',
			prop2: ['x', 'y', 'z'],
			prop3: [100, 200],
		},
	},
);
console.log(result);
```

Result:

```json
{
	"prop1": ["a", "b", "c"],
	"prop2": ["a", "b", "c"],
	"prop3": [1, 2, 3]
}
```

### `$concat`, `$ꓺconcat`

To concatenate arrays (e.g., to push multiple items). The source value must be an array.

-   To push a single item, please see: `$push`, `$ꓺpush`.

```js
const result = mc.merge(
	// First object
	{
		prop1: ['a', 'b'],
		prop2: ['a', 'b'],
	},
	// Merge
	{
		$concat: {
			prop1: ['c', 'd'],
			prop2: { x: 'c' },
		},
	},
);
console.log(result);
```

Result:

```json
{
	"prop1": ["a", "b", "c", "d"],
	"prop2": ["a", "b", { "x": "c" }]
}
```

### `$default`, `$ꓺdefault`

To set default values (i.e., set only if undefined). The source value must be an object.

```js
const result = mc.merge(
	// First object
	{
		prop1: ['a', 'b', 'c'],
		prop2: ['a', 'b', 'c'],
		prop3: {
			a: 'a',
			b: 'b',
			c: {
				d: 'd',
			},
		},
	},
	// Merge
	{
		$default: {
			'prop1': ['default'],
			'prop2': ['default'],
			'prop3.a': 'default',
			'prop3.b': 'default',
			'prop3.c.d': 'default',
			'prop3.c.e': 'default',
			'prop3.f': 'default',
			'prop3.g': ['default'],
		},
	},
);
console.log(result);
```

Result:

```json
{
   "prop1": ["a", "b", "c"],
   "prop2": ["a", "b", "c"],
   "prop3": {
     "a": "a",
     "b": "b",
     "c": {
       "d": "d",
       "e": "default",
     },
   "f": "default",
   "g": ["default"],
}
```

### `$propSortOrder`, `$ꓺpropSortOrder`

To sort object properties using a given order. The source value must be an object.

-   **Important note:** Please be aware. This also has the side-effect of clearing all `undefined` properties from an object, as it is not currently possible, given strategy applied, to apply proper sorting logic otherwise.

```js
const result = mc.merge(
	// First object
	{
		prop3: {
			c: {
				d: 'd',
			},
			b: 'b',
			e: undefined,
		},
		prop00: '00',
		prop1: ['a', 'b', 'c'],
		a: 'a',
		prop2: ['a', 'b', 'c'],
	},
	// Merge
	{
		prop4: '4',
		$propSortOrder: [
			'a',
			'prop0',
			'prop1',
			'prop2',
			'prop3.b',
			'prop3.c.d',
			'prop3.e', // Undefined. Will not appear in sorted object.
			'prop4',
		],
		prop0: '0',
		prop00: '00', // Not in sort order given, so comes after all others.
	},
);
console.log(result);
```

Result:

```json
{
	"a": "a",
	"prop0": "0",
	"prop1": ["a", "b", "c"],
	"prop2": ["a", "b", "c"],
	"prop3": {
		"b": "b",
		"c": {
			"d": "d"
		}
	},
	"prop4": "4",
	"prop00": "00"
}
```

## Customize Merge

You can declare a new merge handler for custom types and/or override default logic. This API returns the previous (i.e., any existing) merge handler so that it can be restored, which is important! Please be sure to restore.

`mc.addMerge(type1, type2, callback)`

-   `type1, type2`: Constructor names of the `first` and `second` values; e.g., `Number, String, Boolean, Object, Array, Date, RegExp, Function, Undefined, Null, Symbol, Set, Map` and other system and custom constructor names are all permissible.
-   `callback`: Merge handler: `(first: unknown, second: unknown, kind: string): unknown`
    -   `first`: First value for merge. Of type `type1` passed to `mc.addMerge()`.
    -   `second`: Second value for merge. Of type `type2` passed to `mc.addMerge()`.
    -   `kind`: Merge kind. One of: `merge`, `patch`, or `update`.

For example, if you always need to union arrays, you can declare a method to merge `Array` with `Array`. Please be sure to restore the original handler to avoid conflicts with other packages depending on `merge-change`. **Alternatively**, you can create an entirely **separate instance** to isolate your customizations; e.g., `mc = mc.newInstance()`. Then add your custom merge handlers to the new instance, and use the new instance to perform your merges.

```js
const previous = mc.addMerge('Array', 'Array', function (first, second, kind) {
	if ('merge' === kind) {
		return first.concat(second).map((v) => mc.merge(undefined, v));
	}
	if ('patch' === kind) {
		first.splice(first.length, 0, ...second);
		return first;
	}
	// Else doing an `update` merge.
	if (0 === second.length) {
		return first; // No update necessary.
	} else {
		return first.concat(second); // Mutation required.
	}
});

// Restores previous handler.
mc.addMerge('Array', 'Array', previous);
```

## Customize Declarative Operation

You can declare a new handler for a declarative operation and/or override default logic. This API returns the previous operation handler so that it can be restored, which is important! Please be sure to restore.

`mc.addOperation(name, callback)`

-   `name`: Operation name; e.g., `$concat`, `$unset`, `$pull`, etc. ... or a new one.
-   `callback`: Operation handler: `(source: unknown, params: unknown, separator?: string): boolean`.
    -   `source`: Value the operation should act upon.
    -   `params`: Value of operator; e.g., `$concat: [params]`.

For example, here's an already-defined operation handler that could be customized to meet the needs of different use cases. Also consider giving your operations unique names or prefixing all of your custom operations to avoid conflicts with other packages depending on `merge-change`. **Alternatively**, you can create an entirely **separate instance** to isolate your customizations; e.g., `mc = mc.newInstance()`. Then add your custom operation handlers to the new instance, and use the new instance to perform your merges.

```js
const previous = mc.addOperation('$concat', (source, params, separator = '.') => {
	if (!source || !this.u.isObject(source)) {
		throw new Error('Invalid $' + ('ꓺ' === separator ? 'ꓺ' : '') + 'concat. Requires object source.');
	}
	if (!params || !mc.u.isObject(params) || Array.isArray(params)) {
		throw new Error('Invalid $' + ('ꓺ' === separator ? 'ꓺ' : '') + 'concat params. Expecting non-array object.');
	}
	const values = params;
	const paths = Object.keys(values);

	for (const path of paths) {
		const value = values[path];
		const array = mc.u.get(source, path, [], separator);

		if (!Array.isArray(array)) {
			throw new Error('Cannot concat onto non-array value.');
		}
		mc.u.set(source, path, array.concat(value), separator);
	}
	return paths.length > 0; // Updates occured?
});

// Restores previous handler.
mc.addOperation('$concat', previous);
```

## Utilities

**Utilities:** Accessed with `mc.u` (recommended) or `mc.utilities`.

> The legacy `mc.utils` accessor continues to work also and is identical.

### `mc.u.type(value)`

Gets real type of any value. The return value is a string; i.e., name of constructor.

```js
console.log(mc.u.type(null)); // 'Null'
console.log(mc.u.type(true)); // 'Boolean'
console.log(mc.u.type(undefined)); // 'Undefined'
console.log(mc.u.type({ foo: 'foo' })); // 'Object'
console.log(mc.u.type(new Object())); // 'Object'
console.log(mc.u.type(new URL('https://foo'))); // 'URL'
```

### `mc.u.types(value)`

Gets real types of any value. The return value is an array; i.e., names of own or inherited constructors.

> The legacy `mc.u.typeList()` utility remains and is identical.

```js
console.log(mc.u.types(null)); // ['Null']
console.log(mc.u.types(undefined)); // ['Undefined']
console.log(mc.u.types({ foo: 'foo' })); // ['Object']
console.log(mc.u.types(new Object())); // ['Object']
console.log(mc.u.types(true)); // ['Boolean', 'Object']
console.log(mc.u.types(1)); // ['Number', 'Object']
console.log(mc.u.types('1')); // ['String', 'Object']
console.log(mc.u.types(new URL('https://foo'))); // ['URL', 'Object']
```

### `mc.u.hasType(value, className)`

Checks instance of class. `className` is string (not constructor). The return value is a boolean.

> The legacy `mc.u.instanceof()` utility remains and is identical.

```js
console.log(mc.u.hasType(100, 'Number')); // true
console.log(mc.u.hasType(new URL('https://foo'), 'URL')); // true
console.log(mc.u.hasType(new URL('https://foo'), 'Object')); // true
```

### `mc.u.equals(valueA, valueB)`

Tests strict equality.

> The legacy `mc.u.equal()` utility remains and is identical.

```js
const obj1 = {};
const obj2 = {};

console.log(mc.u.equals('1', 1)); // false
console.log(mc.u.equals('A', 'A')); // true
console.log(mc.u.equals(obj1, obj1)); // true
console.log(mc.u.equals(obj1, obj2)); // false
console.log(mc.u.equals(obj2, obj2)); // true
```

### `mc.u.isObject(value)`

Checks if value is the language type of Object; e.g., arrays, functions, objects, regexes, `new Number(0)`, `new String('')`.

```js
console.log(mc.u.isObject(null)); // false
console.log(mc.u.isObject(void 0)); // false
console.log(mc.u.isObject(undefined)); // false
console.log(mc.u.isObject(0)); // false
console.log(mc.u.isObject(String(''))); // false
console.log(mc.u.isObject(Number(0))); // false
console.log(mc.u.isObject('')); // false
console.log(mc.u.isObject({})); // true
console.log(mc.u.isObject(new Object())); // true
console.log(mc.u.isObject(() => void 0)); // true
console.log(mc.u.isObject(new URL('https://foo/'))); // true
console.log(mc.u.isObject(new Number(0))); // true
console.log(mc.u.isObject(new String(''))); // true
```

### `mc.u.isPrototypePollutionKey(key)`

Checks if setting a specific property key would alter an object’s prototype.

```js
console.log(mc.u.isPrototypePollutionKey('foo')); // false
console.log(mc.u.isPrototypePollutionKey('__proto__')); // true
console.log(mc.u.isPrototypePollutionKey('__pRotO__')); // true
console.log(mc.u.isPrototypePollutionKey('prototype')); // true
console.log(mc.u.isPrototypePollutionKey('proTotYpe')); // true
console.log(mc.u.isPrototypePollutionKey('constructor')); // true
console.log(mc.u.isPrototypePollutionKey('ConstRuCtor')); // true
```

### `mc.u.clone(value, deep = false)`

Clones any given value. This is loosely based on the structured clone algorithm. Underneath, this uses [\_.clone() in Lodash](https://lodash.com/docs/4.17.15#clone), which supports cloning arrays, array buffers, booleans, date objects, maps, numbers, Object objects, regexes, sets, strings, symbols, and typed arrays. The own enumerable properties of arguments objects are cloned as plain objects. An empty object is returned for uncloneable values such as error objects, functions, DOM nodes, and WeakMaps.

```js
// Shallow.

const arr1 = ['a', 'b', ['c']];
const arr1Clone = mc.u.clone(arr1);
console.log(arr1, arr1Clone); // [ 'a', 'b', [ 'c' ] ] [ 'a', 'b', [ 'c' ] ]
console.log(arr1 === arr1Clone); // false
console.log(arr1[2] === arr1Clone[2]); // true

const obj1 = { a: 'a', b: { c: 'c' } };
const obj1Clone = mc.u.clone(obj1);
console.log(obj1, obj1Clone); // { a: 'a', b: { c: 'c' } } { a: 'a', b: { c: 'c' } }
console.log(obj1 === obj1Clone); // false
console.log(obj1.b === obj1Clone.b); // true

// Deep clones.

const arr2 = ['a', 'b', ['c']];
const arr2Clone = mc.u.clone(arr2, true);
console.log(arr2, arr2Clone); // [ 'a', 'b', [ 'c' ] ] [ 'a', 'b', [ 'c' ] ]
console.log(arr2 === arr2Clone); // false
console.log(arr2[2] === arr2Clone[2]); // false

const obj2 = { a: 'a', b: { c: 'c' } };
const obj2Clone = mc.u.clone(obj2, true);
console.log(obj2, obj2Clone); // { a: 'a', b: { c: 'c' } } { a: 'a', b: { c: 'c' } }
console.log(obj2 === obj2Clone); // false
console.log(obj2.b === obj2Clone.b); // false
```

### `mc.u.splitObjPath(path, separator = '.')`

Splits an object path notation into an array of parts.

-   With arrays use a `[]` notation to indicate a numeric index; e.g., `[0]`.

> The legacy `mc.u.splitPath()` utility remains and is identical.

```js
console.log(mc.u.splitObjPath('')); // [ ]
console.log(mc.u.splitObjPath('a.b.c')); // [ 'a', 'b', 'c' ]
console.log(mc.u.splitObjPath('a.b.c[0]')); // [ 'a', 'b', 'c', 0 ]
console.log(mc.u.splitObjPath('a.b.c[0].foo')); // [ 'a', 'b', 'c', 0, 'foo' ]
console.log(mc.u.splitObjPath('aꓺbꓺc[0]ꓺfoo', 'ꓺ')); // [ 'a', 'b', 'c', 0, 'foo' ]
console.log(mc.u.splitObjPath('a/b/c[0]/foo', '/')); // [ 'a', 'b', 'c', 0, 'foo' ]
```

### `mc.u.toOperable(value)`

Attempts to convert a value into an operable value (i.e., an object that `merge-change` can perform declarative operations on). An inoperable value is an object with no enumerable string-keyed properties of its own. It's possible to convert an object into an operable object if it provides an `.[mc.methods.toOperable]()`, or `.toJSON()` method that returns an underlying operable object reference; i.e., an object with its own enumerable string-keyed properties.

```js
class Custom1 {
	values: {};

	constructor(values = {}) {
		this.values = values;
	}
	toJSON() {
		return this.values; // Reference (good).
	}
}
class Custom2 {
	values: {};

	constructor(values = {}) {
		this.values = values;
	}
	[mc.methods.toOperable]() {
		return this.values; // Reference (good).
	}
	toJSON() {
		return { ...this.values }; // Copy, not a reference (bad).
	}
}
function Custom3(values = {}) {
	for (const [key, value] of Object.entries(values)) {
		this[key] = value;
	}
}

console.log(mc.u.toOperable({ a: 'a', b: 'b', c: 'c' }));
// => Returns same operable plain object value: { a: 'a', b: 'b', c: 'c' }

console.log(mc.u.toOperable(new URL('https://foo/')));
// => Not possible. Returns same URL instance, which is not operable.

console.log(mc.u.toOperable(new Date('2021-01-07T19:10:21.759Z')));
// => Not possible. Returns same Date instance, which is not operable.

console.log(mc.u.toOperable(new Custom1({ a: 'a', b: 'b', c: 'c' })));
// => Returns operable value: { a: 'a', b: 'b', c: 'c' } ... via `.toJSON()`.

console.log(mc.u.toOperable(new Custom2({ a: 'a', b: 'b', c: 'c' })));
// => Returns operable value: { a: 'a', b: 'b', c: 'c' } ... via `.[mc.methods.toOperable]()`.

console.log(mc.u.toOperable(new Custom3({ a: 'a', b: 'b', c: 'c' })));
// => It's not possible to convert Custom3 with this utility as it doesn't offer
//    an `.[mc.methods.toOperable]()` or `.toJSON()` method for conversion. However,
//    it's still considered operable, because it already has its own enumerable
//    string-keyed properties that can be iterated by declarative operation handlers.
```

### `mc.u.toPlain(value, deep = false)`

Converts any value to a plain value; i.e., a primitive value, array, or plain object. In the case of an object, by flattening own enumerable string-keyed properties of value to own enumerable string-keyed properties of a plain object. To customize conversion, you can define the `.[mc.methods.toPlain]()` or `.toJSON()` methods in your object.

> The legacy `mc.u.plain(value, deep = true)` utility remains as a deprecated alias with a slightly different strategy, which is somewhat broken, as it only navigates existing plain objects, and is recursive by default. Please migrate to `mc.u.toPlain()` for an improved experience. However, be cautious, as the new utility does not preserve non-plain object structures; i.e., it actually converts any object to a plain object, as one would expect from this utility.

```js
class Custom1 {
	constructor(values = {}) {
		this.values = values;
	}
	toJSON() {
		return this.values;
	}
}
class Custom2 {
	constructor(values = {}) {
		this.values = values;
	}
	[mc.methods.toPlain]() {
		return this.values;
	}
	toJSON() {
		return { foo: 'foo' };
	}
}
function Custom3(props) {
	for (const [key, value] of Object.entries(props)) {
		this[key] = value;
	}
}
const plain = mc.u.toPlain(
	{
		foo: 'foo',
		bar: 1,
		url: new URL('https://foo/'),
		date: new Date('2021-01-07T19:10:21.759Z'),
		object1: new Object({ id: '6010a8c75b9b393070e42e68' }),
		object2: { a: 'a', b: 'b', c: 'c', d: new Custom1({ a: 'a', b: 'b', c: 'c' }) },
		custom1: new Custom1({ a: 'a', b: 'b', c: 'c', d: new Custom1({ a: 'a', b: 'b', c: 'c' }) }),
		custom2: new Custom2({ a: 'a', b: 'b', c: 'c', d: new Custom2({ a: 'a', b: 'b', c: 'c' }) }),
		custom3: new Custom3({ a: 'a', b: 'b', c: 'c', d: new Custom3({ a: 'a', b: 'b', c: 'c' }) }),
		customArray: [new Custom1({ a: 'a', b: 'b', c: 'c' }), new Custom2({ a: 'a', b: 'b', c: 'c' })],
	},
	true, // Deeply.
);
console.log(plain);
```

Result (plain).

```js
{
	foo: 'foo',
	bar: 1,
	url: {},
	date: {},
	object1: { id: '6010a8c75b9b393070e42e68' },
	object2: { a: 'a', b: 'b', c: 'c', d: { a: 'a', b: 'b', c: 'c' } },
	custom1: { a: 'a', b: 'b', c: 'c', d: { a: 'a', b: 'b', c: 'c' } },
	custom2: { a: 'a', b: 'b', c: 'c', d: { a: 'a', b: 'b', c: 'c' } },
	custom3: { a: 'a', b: 'b', c: 'c', d: { a: 'a', b: 'b', c: 'c' } },
	customArray: [ { a: 'a', b: 'b', c: 'c' }, { a: 'a', b: 'b', c: 'c' } ],
}
```

### `mc.u.toFlat(value, path = '', separator = '.', clearUndefined = false)`

Converts a nested structure to a flat object containing inherited enumerable string keyed properties. Property names become paths with `separator`. Arrays use a `[]` notation to indicate numeric indexes; e.g., `[0]`. To customize conversion, you can define the `.[mc.methods.toFlat]()` or `.toJSON()` methods in your object.

> The legacy `mc.u.flat()` remains as a deprecated alias with a slightly different and somewhat broken strategy, as it does not flatten arrays, and it doesn’t use the Lodash-compatible array `[]` bracket syntax for arrays. Thus, it doesn't actually flatten an object. Migrate to `mc.u.toFlat()` for an improved experience.

```js
const value = {
	a: {
		b: {
			c: 100,
			d: [1, 2, { '3': 3, four: 4 }],
		},
	},
	e: 'foo',
};
const flat = mc.u.toFlat(value);
console.log(flat);
```

Result (flat).

```js
{
  'a.b.c': 100,
  'a.b.d[0]': 1,
  'a.b.d[1]': 2,
  'a.b.d[2].3': 3,
  'a.b.d[2].four': 4,
  'e': 'foo',
}
```

### `mc.u.toDiff(source, compare, {ignore = [], separator = '.'})`

To calculate the difference between `source` and `compare` value. The return value is an object with `$set` and `$unset` operators. Return value can be used in merge functions. The `ignore` parameter is a list of properties that are not included in the comparison.

> The legacy `mc.u.diff()` remains as a deprecated alias with a slightly different and somewhat broken strategy, as it uses the legacy `mc.u.plain()` instead of `mc.u.toPlain()`. Migrate to `mc.u.toDiff()` for an improved experience.

```js
const first = {
	name: 'value',
	profile: {
		surname: 'Surname',
		birthday: new Date(),
		avatar: {
			url: 'pic.png',
		},
	},
	access: [100, 350, 200],
	secret: 'x',
};

const second = {
	login: 'value',
	profile: {
		surname: 'Surname2',
		avatar: {
			url: 'new/pic.png',
		},
	},
	access: [700],
};

const diff = mc.u.toDiff(first, second, { ignore: ['secret'], separator: '/' });
console.log(diff);
```

Result (diff).

```js
{
  $set: {
    'login': 'value',
    'profile.surname': 'Surname2',
    'profile.avatar.url': 'new/pic.png',
    'access': [ 700 ]
  },
  $unset: [ 'profile.birthday', 'name' ]
}
```

### `mc.u.matches(value, conditions = {}, data = {}, separator = '.', errors = [])`

Compares a value to a set of conditions given in the form of properties and their expected values. The structured `conditions` given may contain path notations beginning with `$` or `$ꓺ`, which will be used as getters with `data` as the source. If `errors` is given as an empty array, it is populated by reference with the list of paths that failed to match. This utility returns `true` if all conditions match.

```js
const matches = mc.u.matches(
	{ prop1: '1', prop2: 'admin', prop3: 'admin@example.com' }, // Structure to check.
	{ prop1: '1', prop2: '$session.user.name' }, // Conditions that must match up.
	{
		// Data source with any paths given by conditions.
		session: {
			user: {
				id: 1,
				name: 'admin',
				email: 'admin@example.com',
			},
		},
	},
);
console.log(matches); // true
```

## License

-   Released under an [MIT License](LICENSE).
-   Original copyright 2020 © [VladimirShestakov](https://github.com/VladimirShestakov).
-   This fork is copyright 2021-2023 © [Clever Canyon](https://github.com/clevercanyon/merge-change.fork).
