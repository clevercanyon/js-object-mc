const mc = require('../src/index.js');

describe('Test mc.mergeStructuredClones()', () => {
	test('mc.mergeStructuredClones(Object, Object)', () => {
		const obj1 = {
			a: 'a',
			b: 'b',
			c: {
				d: 'd',
			},
		};
		const obj2 = {
			a: 'merged',
			b: 'merged',
			c: {
				d: 'merged',
			},
		};
		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toStrictEqual({
			a: 'merged',
			b: 'merged',
			c: {
				d: 'merged',
			},
		});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(Object, Object) [from README.md]', () => {
		let source = {
			test: {
				string: '1',
				integer: 1,
				boolean: true,
				url: new URL('https://source.tld/'),
			},
		};
		let merge = {
			test: {
				integer: 2,
				date: new Date('2023-01-01'),
				url: new URL('https://merge.tld/'),
				$unset: ['string'], // $unset is a declarative operation.
			},
		};
		const result = mc.mergeStructuredClones(source, merge);

		expect(result).toMatchObject({
			test: {
				integer: 2,
				boolean: true,
				url: {},
				date: {},
			},
		});
		expect(result !== source).toBe(true);
		expect(result !== merge).toBe(true);

		expect(mc.u.type(result.test.url) === 'Object').toBe(true);
		expect(mc.u.type(result.test.date) === 'Date').toBe(true);

		expect(result.test.url !== merge.test.url).toBe(true);
		expect(result.test.date !== merge.test.date).toBe(true);
	});
	test('mc.mergeStructuredClones(Object, Object) [complex]', () => {
		class Custom {
			values = {};

			constructor(values = {}) {
				this.values = values;
			}
		}
		const obj1 = {
			'1': 1,
			a: 'a',
			b: 'b',
			c: {
				_array: ['array', true],
				_object: {object: true},
				_date: new Date('2023-01-01'),
				_set: new Set(['a', 'b', 'c', 'merged']),
				_weakSet: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {merged: true}]),
				_map: new Map(Object.entries({a: 'a', b: 'b', c: 'c', merged: true})),
				_weakMap: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{merged: true}, true]]),
				_url: new URL('http://foo/'),
				_arrayBuffer: new ArrayBuffer(1),
				_error: new Error(),
				_custom: new Custom({custom: true}),
				_arrowFunction: () => 'arrowFunction',
				_asyncArrowFunction: async () => 'asyncArrowFunction',
				_function: function () { return 'function'; },
				_asyncFunction: async function () { return 'asyncFunction'; },
			},
			e: {
				f: {
					g: [
						{
							h: [1, {'2': 2}]
						},
					],
				},
			},
			i: [0],
		};
		const obj2 = {
			'1': 'merged',
			a: { merged: true },
			b: [ 'merged', true ],
			c: {
				array: ['array', true],
				object: {object: true},
				date: new Date('2023-01-01'),
				set: new Set(['a', 'b', 'c', 'merged']),
				weakSet: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {merged: true}]),
				map: new Map(Object.entries({a: 'a', b: 'b', c: 'c', merged: true})),
				weakMap: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{merged: true}, true]]),
				url: new URL('http://foo/'),
				arrayBuffer: new ArrayBuffer(1),
				error: new Error(),
				custom: new Custom({custom: true}),
				arrowFunction: () => 'arrowFunction',
				asyncArrowFunction: async () => 'asyncArrowFunction',
				function: function () { return 'function'; },
				asyncFunction: async function () { return 'asyncFunction'; },
			},
			$set: { 'i[0]': 'merged', 'e.f.g[0].h': 'merged' },
		};
		expect(() => mc.mergeStructuredClones(obj1, obj2)).toThrow();
	});
	test('mc.mergeStructuredClones(undefined, Object)', () => {
		const obj1 = undefined;
		const obj2 = {merged: true};

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toStrictEqual({merged: true});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(undefined, URL)', () => {
		const obj1 = undefined;
		const obj2 = new URL('http://bar/');

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(Object.keys(result)).toStrictEqual([]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(URL, undefined)', () => {
		const obj1 = new URL('http://bar/');
		const obj2 = undefined;

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(Object.keys(result)).toStrictEqual([]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(URL, URL)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = new URL('http://bar/');

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(Object.keys(result)).toStrictEqual([]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(URL, Object)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toStrictEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(Array, Object)', () => {
		const obj1 = [1, 2, 3];
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toStrictEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(Object, Array)', () => {
		const obj1 = {a: 'a', b: 'b', c: 'c'};
		const obj2 = [1, 2, 3];

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toStrictEqual([1, 2, 3]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeStructuredClones(String, String)', () => {
		const obj1 = 'obj1';
		const obj2 = 'obj2';

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toBe('obj2');
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.mergeStructuredClones(String, Number)', () => {
		const obj1 = 'obj1';
		const obj2 = 2;

		const result = mc.mergeStructuredClones(obj1, obj2);

		expect(result).toBe(2);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
});
