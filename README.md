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

Merge with **deep cloning** without changing the source objects. Great for creating or extending objects from the example (source).

```js
mc.merge(source, ...values);
```

Example

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
console.log(result); // { a: { two: 2,  three: 3} }
```

### Patch

Merge with **mutation** of the source objects. Nice for patching. New instances will not be created.

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

**Immutable merge** - create new instances only if there are diffs (also in inner properties). Nice for state management.

```js
mc.update(source, ...changes);
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

When merging objects, you can perform declarative operations at the same time.
Supported in all merge methods. The syntax is similar to mongodb.

### `$set`, `$ꓺset`

To set (or replace) property without deep merge.

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
			'a.two': 20, // Field keys can be a path.
		},
	},
);
console.log(result);
```

Result

```json
{
	"a": {
		"three": 3,
		"two": 20
	}
}
```

### `$unset`, `$ꓺunset`

To unset properties by name (or path)

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

Result

```json
{
	"a": {
		"one": 1
	}
}
```

#### To unset all fields used `*`

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

Result

```json
{
	"a": {}
}
```

### `$leave`, `$ꓺleave`

To leave properties by name (or path). All other properties will be removed.

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

Result

```json
{
	"a": {
		"two": 2
	}
}
```

### `$push`, `$ꓺpush`

To push one value to an array. The source property must be an array.

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

Result

```json
{
	"prop1": ["a", "b", ["c", "d"]],
	"prop2": ["a", "b", { "x": "c" }],
	"prop3": ["a", "b", "c"]
}
```

### `$pull`, `$ꓺpull`

To pull values from an array. The source property must be an array.

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

Result

```json
{
	"prop1": ["a", "b", "c"],
	"prop2": ["a", "b", "c"],
	"prop3": [1, 2, 3]
}
```

### `$concat`, `$ꓺconcat`

To concatenate arrays. The source property must be an array.

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

Result

```json
{
	"prop1": ["a", "b", "c", "d"],
	"prop2": ["a", "b", { "x": "c" }]
}
```

### `$default`, `$ꓺdefault`

To set default values. The source property must be an object.

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

Result

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

Sorts object properties using order given. The source property must be an object.

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

Result

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

For example, if you always need to union arrays, you can declare a method to merge `Array` with `Array`.

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
    -   `params`: Value of operator; e.g., `$concat: [...params]`.

For example, here's an already-defined operation handler that could be customized to meet the needs of different use cases. Also consider giving your operations unique names or prefixing all of your custom operations to avoid conflicts with other packages depending on `merge-change`.

```js
const previous = mc.addOperation('$concat', (source, params, separator = '.') => {
	if (!Array.isArray(params)) {
		throw new Error('$concat operation requires an array.');
	}
	const paths = Object.keys(params);

	for (const path of paths) {
		const value = params[path];
		let array = mc.u.get(source, path, [], separator);

		if (!Array.isArray(array)) {
			throw new Error('$concat operation requires a source array.');
		}
		array = array.concat(value);
		mc.u.set(source, path, array, separator);
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

Gets real type of any value. The return value is a string - the name of the constructor.

```js
console.log(mc.u.type(null)); // 'Null'
console.log(mc.u.type(true)); // 'Boolean'
console.log(mc.u.type(undefined)); // 'Undefined'
console.log(mc.u.type({ foo: 'foo' })); // 'Object'
console.log(mc.u.type(new Object())); // 'Object'
console.log(mc.u.type(new URL('https://foo'))); // 'URL'
```

### `mc.u.types(value)`

Gets real types of any value. The return value is an array - the names of own or inherited the constructors.

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

### `mc.u.toPlain(value, deep = false)`

Converts value to a plain object flattening inherited enumerable string keyed properties of value to own properties of the plain object. To customize conversion, you can define the `[mc.methods.toPlain]()` or `.toJSON()` methods in your object.

> The legacy `mc.u.plain(value, deep = true)` utility remains as a deprecated alias with a slightly different strategy, which is somewhat broken, as it only navigates existing plain objects, and is recursive by default. Please migrate to `mc.u.toPlain()` for an improved experience. However, be cautious, as the new utility does not preserve non-plain object structures; i.e., it actually converts any object to a plain object, as one would expect from this utility.

```js
const plain = mc.u.toPlain({
	date: new Date('2021-01-07T19:10:21.759Z'),
	prop: new Object({ _id: '6010a8c75b9b393070e42e68' }),
});
console.log(plain);
```

Result (plain).

```js
{
  date: '2021-01-07T19:10:21.759Z',
  prop: { _id: '6010a8c75b9b393070e42e68' }
}
```

### `mc.u.toFlat(value, path = '', separator = '.', clearUndefined = false)`

Converts a nested structure to a flat object containing inherited enumerable string keyed properties. Property names become paths with `separator`. Arrays use a `[]` notation to represent their numeric index; e.g., `[0]`. To customize conversion, you can define the `[mc.methods.toFlat]()` or `.toJSON()` methods in your object.

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

Result (flat). @todo: fix

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

### `mc.u.diff(source, compare, {ignore = [], separator = '.'})`

To calculate the difference between `source` and `compare` value. The return value is an object with `$set` and `$unset` operators. Return value can be used in merge functions. The `ignore` parameter - is a list of properties that are not included in the comparison.

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

const diff = mc.u.diff(first, second, { ignore: ['secret'], separator: '/' });
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
