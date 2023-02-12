const mc = require('../src/index.js');

describe('Test mc.mergeClones()', () => {
	test('mc.mergeClones(Object, Object)', () => {
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
		const result = mc.mergeClones(obj1, obj2);

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
	test('mc.mergeClones(Object, Object) [from README.md]', () => {
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
		const result = mc.mergeClones(source, merge);

		expect(result).toStrictEqual({
			test: {
				integer: 2,
				boolean: true,
				url: new URL('https://merge.tld/'),
				date: new Date('2023-01-01'),
			},
		});
		expect(result !== source).toBe(true);
		expect(result !== merge).toBe(true);

		expect(result.test.url !== merge.test.url).toBe(true);
		expect(result.test.date !== merge.test.date).toBe(true);
	});
	test('mc.mergeClones(Object, Object) [complex]', () => {
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
		const result = mc.mergeClones(obj1, obj2);

		expect(result).toMatchObject({
			'1': 'merged',
			a: { merged: true },
			b: [ 'merged', true ],
			c: expect.any(Object),
			e: {
				f: {
					g: [
						{
							h: 'merged'
						},
					],
				},
			},
			i: ['merged'],
		});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);

		expect(mc.u.type(result.c._array)).toBe('Array');
		expect(mc.u.type(result.c._object)).toBe('Object');
		expect(mc.u.type(result.c._date)).toBe('Date');
		expect(mc.u.type(result.c._set)).toBe('Set');
		expect(mc.u.type(result.c._weakSet)).toBe('Object');
		expect(mc.u.type(result.c._map)).toBe('Map');
		expect(mc.u.type(result.c._weakMap)).toBe('Object');
		expect(mc.u.type(result.c._url)).toBe('URL');
		expect(mc.u.type(result.c._arrayBuffer)).toBe('ArrayBuffer');
		expect(mc.u.type(result.c._error)).toBe('Error');
		expect(mc.u.type(result.c._custom)).toBe('Custom');
		expect(mc.u.type(result.c._arrowFunction)).toBe('Object');
		expect(mc.u.type(result.c._asyncArrowFunction)).toBe('Object');
		expect(mc.u.type(result.c._function)).toBe('Object');
		expect(mc.u.type(result.c._asyncFunction)).toBe('Object');

		expect(result.c._array === obj1.c._array).toBe(false);
		expect(result.c._object === obj1.c._object).toBe(false);
		expect(result.c._date === obj1.c._date).toBe(false);
		expect(result.c._set === obj1.c._set).toBe(false);
		expect(result.c._weakSet === obj1.c._weakSet).toBe(false);
		expect(result.c._map === obj1.c._map).toBe(false);
		expect(result.c._weakMap === obj1.c._weakMap).toBe(false);
		expect(result.c._url === obj1.c._url).toBe(false);
		expect(result.c._arrayBuffer === obj1.c._arrayBuffer).toBe(false);
		expect(result.c._error === obj1.c._error).toBe(false);
		expect(result.c._custom === obj1.c._custom).toBe(false);
		expect(result.c._arrowFunction === obj1.c._arrowFunction).toBe(false);
		expect(result.c._asyncArrowFunction === obj1.c._asyncArrowFunction).toBe(false);
		expect(result.c._function === obj1.c._function).toBe(false);
		expect(result.c._asyncFunction === obj1.c._asyncFunction).toBe(false);

		expect(mc.u.type(result.c.array)).toBe('Array');
		expect(mc.u.type(result.c.object)).toBe('Object');
		expect(mc.u.type(result.c.date)).toBe('Date');
		expect(mc.u.type(result.c.set)).toBe('Set');
		expect(mc.u.type(result.c.weakSet)).toBe('Object');
		expect(mc.u.type(result.c.map)).toBe('Map');
		expect(mc.u.type(result.c.weakMap)).toBe('Object');
		expect(mc.u.type(result.c.url)).toBe('URL');
		expect(mc.u.type(result.c.arrayBuffer)).toBe('ArrayBuffer');
		expect(mc.u.type(result.c.error)).toBe('Error');
		expect(mc.u.type(result.c.custom)).toBe('Custom');
		expect(mc.u.type(result.c.arrowFunction)).toBe('Object');
		expect(mc.u.type(result.c.asyncArrowFunction)).toBe('Object');
		expect(mc.u.type(result.c.function)).toBe('Object');
		expect(mc.u.type(result.c.asyncFunction)).toBe('Object');

		expect(result.c.array === obj2.c.array).toBe(false);
		expect(result.c.object === obj2.c.object).toBe(false);
		expect(result.c.date === obj2.c.date).toBe(false);
		expect(result.c.set === obj2.c.set).toBe(false);
		expect(result.c.weakSet === obj2.c.weakSet).toBe(false);
		expect(result.c.map === obj2.c.map).toBe(false);
		expect(result.c.weakMap === obj2.c.weakMap).toBe(false);
		expect(result.c.url === obj2.c.url).toBe(false);
		expect(result.c.arrayBuffer === obj2.c.arrayBuffer).toBe(false);
		expect(result.c.error === obj2.c.error).toBe(false);
		expect(result.c.custom === obj2.c.custom).toBe(false);
		expect(result.c.arrowFunction === obj2.c.arrowFunction).toBe(false);
		expect(result.c.asyncArrowFunction === obj2.c.asyncArrowFunction).toBe(false);
		expect(result.c.function === obj2.c.function).toBe(false);
		expect(result.c.asyncFunction === obj2.c.asyncFunction).toBe(false);
	});
	test('mc.mergeClones(undefined, Object)', () => {
		const obj1 = undefined;
		const obj2 = {merged: true};

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual({merged: true});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(undefined, URL)', () => {
		const obj1 = undefined;
		const obj2 = new URL('http://bar/');

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(URL, undefined)', () => {
		const obj1 = new URL('http://bar/');
		const obj2 = undefined;

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(URL, URL)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = new URL('http://bar/');

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(URL, Object)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(Array, Object)', () => {
		const obj1 = [1, 2, 3];
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(Object, Array)', () => {
		const obj1 = {a: 'a', b: 'b', c: 'c'};
		const obj2 = [1, 2, 3];

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toStrictEqual([1, 2, 3]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.mergeClones(String, String)', () => {
		const obj1 = 'obj1';
		const obj2 = 'obj2';

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toBe('obj2');
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.mergeClones(String, Number)', () => {
		const obj1 = 'obj1';
		const obj2 = 2;

		const result = mc.mergeClones(obj1, obj2);

		expect(result).toBe(2);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
});
