const mc = require('../src/index.js');

describe('Test mc.patch()', () => {
	test('mc.patch(Object, Object)', () => {
		const obj1 = {
			'1': 1,
			a: 'a',
			b: 'b',
			c: {
				d: 'd',
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
			i: 'patched',
		};
		const result = mc.patch(obj1, obj2);

		expect(result.i).toBe('patched');
		expect(result === obj1).toBe(true);
		expect(result === obj2).toBe(false);
	});
	test('mc.patch(Object, Object) [complex]', () => {
		const obj1 = {
			'1': 1,
			a: 'a',
			b: 'b',
			c: {
				d: new Set(['d']),
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
			'1': 'patched',
			i: 'patched',
			a: { a: 1 },
			b: 'patched',
			c: {
				c: new Date('2023-01-01'),
				d: new Set(['a', 'b', 'c', 'patched']),
				e: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {patched: true}]),
				f: new Map(Object.entries({a: 'a', b: 'b', c: 'c', patched: true})),
				g: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{patched: true}, true]]),
				h: new URL('http://foo/'),
			},
			$set: { 'e.f.g[0].h': 'patched' },
		};
		const result = mc.patch(obj1, obj2);

		expect(result['1']).toBe('patched');
		expect(result.i).toBe('patched');
		expect(result.a).toEqual({a: 1});
		expect(result.b).toBe('patched');
		expect(result.c).toEqual({
			c: new Date('2023-01-01'),
			d: new Set(['a', 'b', 'c', 'patched']),
			e: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {patched: true}]),
			f: new Map(Object.entries({a: 'a', b: 'b', c: 'c', patched: true})),
			g: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{patched: true}, true]]),
			h: new URL('http://foo/'),
		});
		expect(result.e.f.g[0].h).toBe('patched');

		expect(result === obj1).toBe(true);
		expect(result === obj2).toBe(false);
		expect(result.c.c === obj2.c.c).toBe(true);
		expect(result.c.d === obj2.c.d).toBe(true);
		expect(result.c.e === obj2.c.e).toBe(true);
		expect(result.c.f === obj2.c.f).toBe(true);
		expect(result.c.g === obj2.c.g).toBe(true);
		expect(result.c.h === obj2.c.h).toBe(true);
	});
	test('mc.patch(undefined, Object)', () => {
		const obj1 = undefined;
		const obj2 = {patched: true};

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual({patched: true});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(undefined, URL)', () => {
		const obj1 = undefined;
		const obj2 = new URL('http://bar/');

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(URL, undefined)', () => {
		const obj1 = new URL('http://bar/');
		const obj2 = undefined;

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(true);
		expect(result === obj2).toBe(false);
	});
	test('mc.patch(URL, URL)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = new URL('http://bar/');

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(URL, Object)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(Array, Object)', () => {
		const obj1 = [1, 2, 3];
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(Object, Array)', () => {
		const obj1 = {a: 'a', b: 'b', c: 'c'};
		const obj2 = [1, 2, 3];

		const result = mc.patch(obj1, obj2);

		expect(result).toEqual([1, 2, 3]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(String, String)', () => {
		const obj1 = 'obj1';
		const obj2 = 'obj2';

		const result = mc.patch(obj1, obj2);

		expect(result).toBe('obj2');
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.patch(String, Number)', () => {
		const obj1 = 'obj1';
		const obj2 = 2;

		const result = mc.patch(obj1, obj2);

		expect(result).toBe(2);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
});
