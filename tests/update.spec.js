const mc = require('../src/index.js');

describe('Test mc.update()', () => {
	test('mc.update(Object, Object)', () => {
		const obj1 = {
			a: 'a',
			b: 'b',
			c: {
				d: 'd',
			},
		};
		const obj2 = {
			a: 'updated',
			b: 'updated',
			c: {
				d: 'updated',
			},
		};
		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual({
			a: 'updated',
			b: 'updated',
			c: {
				d: 'updated',
			},
		});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.update(Object, Object) [from README.md]', () => {
		let source = {
			test: {
				string: '1',
				integer: 1,
				boolean: true,
				url: new URL('https://source.tld/'),
			},
		};
		let update = {
			test: {
				integer: 2,
				date: new Date('2023-01-01'),
				url: new URL('https://update.tld/'),
				$unset: ['string'], // $unset is a declarative operation.
			},
		};
		const result = mc.update(source, update);

		expect(result).toStrictEqual({
			test: {
				integer: 2,
				boolean: true,
				url: new URL('https://update.tld/'),
				date: new Date('2023-01-01'),
			},
		});
		expect(result === source).toBe(false);
		expect(result !== update).toBe(true);

		expect(result.test.url === update.test.url).toBe(true);
		expect(result.test.date === update.test.date).toBe(true);
	});
	test('mc.update(Object, Object) [also from README.md]', () => {
		let source = {
			test: {
				string: '1',
				integer: 1,
				boolean: true,
				url: new URL('https://source.tld/'),
			},
		};
		let update = {
			test: {
				string: '1',
				integer: 1,
				boolean: true,
			},
		};
		const result = mc.update(source, update);

		expect(result).toStrictEqual({
			test: {
				string: '1',
				integer: 1,
				boolean: true,
				url: new URL('https://source.tld/'),
			},
		});
		expect(result === source).toBe(true);
		expect(result !== update).toBe(true);

		expect(result.test.url === source.test.url).toBe(true);
	});
	test('mc.update(Object, Object) [complex]', () => {
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
				_set: new Set(['a', 'b', 'c', 'updated']),
				_weakSet: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {updated: true}]),
				_map: new Map(Object.entries({a: 'a', b: 'b', c: 'c', updated: true})),
				_weakMap: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{updated: true}, true]]),
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
			'1': 'updated',
			a: { updated: true },
			b: [ 'updated', true ],
			c: {
				array: ['array', true],
				object: {object: true},
				date: new Date('2023-01-01'),
				set: new Set(['a', 'b', 'c', 'updated']),
				weakSet: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {updated: true}]),
				map: new Map(Object.entries({a: 'a', b: 'b', c: 'c', updated: true})),
				weakMap: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{updated: true}, true]]),
				url: new URL('http://foo/'),
				arrayBuffer: new ArrayBuffer(1),
				error: new Error(),
				custom: new Custom({custom: true}),
				arrowFunction: () => 'arrowFunction',
				asyncArrowFunction: async () => 'asyncArrowFunction',
				function: function () { return 'function'; },
				asyncFunction: async function () { return 'asyncFunction'; },
			},
			$set: { 'i[0]': 'updated', 'e.f.g[0].h': 'updated' },
		};
		const result = mc.update(obj1, obj2);

		expect(result).toMatchObject({
			'1': 'updated',
			a: { updated: true },
			b: [ 'updated', true ],
			c: expect.any(Object),
			e: {
				f: {
					g: [
						{
							h: 'updated'
						},
					],
				},
			},
			i: ['updated'],
		});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);

		expect(mc.u.type(result.c._array)).toBe('Array');
		expect(mc.u.type(result.c._object)).toBe('Object');
		expect(mc.u.type(result.c._date)).toBe('Date');
		expect(mc.u.type(result.c._set)).toBe('Set');
		expect(mc.u.type(result.c._weakSet)).toBe('WeakSet');
		expect(mc.u.type(result.c._map)).toBe('Map');
		expect(mc.u.type(result.c._weakMap)).toBe('WeakMap');
		expect(mc.u.type(result.c._url)).toBe('URL');
		expect(mc.u.type(result.c._arrayBuffer)).toBe('ArrayBuffer');
		expect(mc.u.type(result.c._error)).toBe('Error');
		expect(mc.u.type(result.c._custom)).toBe('Custom');
		expect(mc.u.type(result.c._arrowFunction)).toBe('Function');
		expect(mc.u.type(result.c._asyncArrowFunction)).toBe('AsyncFunction');
		expect(mc.u.type(result.c._function)).toBe('Function');
		expect(mc.u.type(result.c._asyncFunction)).toBe('AsyncFunction');

		expect(result.c._array === obj1.c._array).toBe(true);
		expect(result.c._object === obj1.c._object).toBe(true);
		expect(result.c._date === obj1.c._date).toBe(true);
		expect(result.c._set === obj1.c._set).toBe(true);
		expect(result.c._weakSet === obj1.c._weakSet).toBe(true);
		expect(result.c._map === obj1.c._map).toBe(true);
		expect(result.c._weakMap === obj1.c._weakMap).toBe(true);
		expect(result.c._url === obj1.c._url).toBe(true);
		expect(result.c._arrayBuffer === obj1.c._arrayBuffer).toBe(true);
		expect(result.c._error === obj1.c._error).toBe(true);
		expect(result.c._custom === obj1.c._custom).toBe(true);
		expect(result.c._arrowFunction === obj1.c._arrowFunction).toBe(true);
		expect(result.c._asyncArrowFunction === obj1.c._asyncArrowFunction).toBe(true);
		expect(result.c._function === obj1.c._function).toBe(true);
		expect(result.c._asyncFunction === obj1.c._asyncFunction).toBe(true);

		expect(mc.u.type(result.c.array)).toBe('Array');
		expect(mc.u.type(result.c.object)).toBe('Object');
		expect(mc.u.type(result.c.date)).toBe('Date');
		expect(mc.u.type(result.c.set)).toBe('Set');
		expect(mc.u.type(result.c.weakSet)).toBe('WeakSet');
		expect(mc.u.type(result.c.map)).toBe('Map');
		expect(mc.u.type(result.c.weakMap)).toBe('WeakMap');
		expect(mc.u.type(result.c.url)).toBe('URL');
		expect(mc.u.type(result.c.arrayBuffer)).toBe('ArrayBuffer');
		expect(mc.u.type(result.c.error)).toBe('Error');
		expect(mc.u.type(result.c.custom)).toBe('Custom');
		expect(mc.u.type(result.c.arrowFunction)).toBe('Function');
		expect(mc.u.type(result.c.asyncArrowFunction)).toBe('AsyncFunction');
		expect(mc.u.type(result.c.function)).toBe('Function');
		expect(mc.u.type(result.c.asyncFunction)).toBe('AsyncFunction');

		expect(result.c.array === obj2.c.array).toBe(true);
		expect(result.c.object === obj2.c.object).toBe(true);
		expect(result.c.date === obj2.c.date).toBe(true);
		expect(result.c.set === obj2.c.set).toBe(true);
		expect(result.c.weakSet === obj2.c.weakSet).toBe(true);
		expect(result.c.map === obj2.c.map).toBe(true);
		expect(result.c.weakMap === obj2.c.weakMap).toBe(true);
		expect(result.c.url === obj2.c.url).toBe(true);
		expect(result.c.arrayBuffer === obj2.c.arrayBuffer).toBe(true);
		expect(result.c.error === obj2.c.error).toBe(true);
		expect(result.c.custom === obj2.c.custom).toBe(true);
		expect(result.c.arrowFunction === obj2.c.arrowFunction).toBe(true);
		expect(result.c.asyncArrowFunction === obj2.c.asyncArrowFunction).toBe(true);
		expect(result.c.function === obj2.c.function).toBe(true);
		expect(result.c.asyncFunction === obj2.c.asyncFunction).toBe(true);
	});
	test('mc.update(undefined, Object)', () => {
		const obj1 = undefined;
		const obj2 = {patched: true};

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual({patched: true});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(undefined, URL)', () => {
		const obj1 = undefined;
		const obj2 = new URL('http://bar/');

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(URL, undefined)', () => {
		const obj1 = new URL('http://bar/');
		const obj2 = undefined;

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(true);
		expect(result === obj2).toBe(false);
	});
	test('mc.update(URL, URL)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = new URL('http://bar/');

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(URL, Object)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(Array, Object)', () => {
		const obj1 = [1, 2, 3];
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(Object, Array)', () => {
		const obj1 = {a: 'a', b: 'b', c: 'c'};
		const obj2 = [1, 2, 3];

		const result = mc.update(obj1, obj2);

		expect(result).toStrictEqual([1, 2, 3]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(String, String)', () => {
		const obj1 = 'obj1';
		const obj2 = 'obj2';

		const result = mc.update(obj1, obj2);

		expect(result).toBe('obj2');
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.update(String, Number)', () => {
		const obj1 = 'obj1';
		const obj2 = 2;

		const result = mc.update(obj1, obj2);

		expect(result).toBe(2);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
});
