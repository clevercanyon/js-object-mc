const mc = require('../index.js');

describe('Test mc.merge()', () => {
	test('mc.merge(Object, Object)', () => {
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
			i: 'merged',
		};
		const result = mc.merge(obj1, obj2);

		expect(result.i).toBe('merged');
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(Object, Object) [complex]', () => {
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
			'1': 'merged',
			i: 'merged',
			a: { a: 1 },
			b: 'merged',
			c: {
				c: new Date('2023-01-01'),
				d: new Set(['a', 'b', 'c', 'merged']),
				e: new WeakSet([{a: 'a'}, {b: 'b'}, {c: 'c'}, {merged: true}]),
				f: new Map(Object.entries({a: 'a', b: 'b', c: 'c', merged: true})),
				g: new WeakMap([[{a: 'a'}, 'a'], [{b: 'b'}, 'b'], [{c: 'c'}, 'c'], [{merged: true}, true]]),
				h: new URL('http://foo/'),
			},
			$set: { 'e.f.g[0].h': 'merged' },
		};
		const result = mc.merge(obj1, obj2);

		expect(result['1']).toBe('merged');
		expect(result.i).toBe('merged');
		expect(result.a).toEqual({a: 1});
		expect(result.b).toBe('merged');
		expect(result.c).toEqual({
			c: new Date('2023-01-01'),
			d: new Set(['a', 'b', 'c', 'merged']),
			e: { /* A WeakSet is not cloneable. */ },
			f: new Map(Object.entries({a: 'a', b: 'b', c: 'c', merged: true})),
			g: { /* A WeakMap is not cloneable. */ },
			h: new URL('http://foo/'),
		});
		expect(result.e.f.g[0].h).toBe('merged');

		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
		expect(result.c.c === obj2.c.c).toBe(false);
		expect(result.c.d === obj2.c.d).toBe(false);
		expect(result.c.e === obj2.c.e).toBe(false);
		expect(result.c.f === obj2.c.f).toBe(false);
		expect(result.c.g === obj2.c.g).toBe(false);
		expect(result.c.h === obj2.c.h).toBe(false);
	});
	test('mc.merge(undefined, Object)', () => {
		const obj1 = undefined;
		const obj2 = {merged: true};

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual({merged: true});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(undefined, URL)', () => {
		const obj1 = undefined;
		const obj2 = new URL('http://bar/');

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(URL, undefined)', () => {
		const obj1 = new URL('http://bar/');
		const obj2 = undefined;

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(URL, URL)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = new URL('http://bar/');

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual(new URL('http://bar/'));
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(URL, Object)', () => {
		const obj1 = new URL('http://foo/');
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(Array, Object)', () => {
		const obj1 = [1, 2, 3];
		const obj2 = {a: 'a', b: 'b', c: 'c'};

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual({a: 'a', b: 'b', c: 'c'});
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(Object, Array)', () => {
		const obj1 = {a: 'a', b: 'b', c: 'c'};
		const obj2 = [1, 2, 3];

		const result = mc.merge(obj1, obj2);

		expect(result).toEqual([1, 2, 3]);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(false);
	});
	test('mc.merge(String, String)', () => {
		const obj1 = 'obj1';
		const obj2 = 'obj2';

		const result = mc.merge(obj1, obj2);

		expect(result).toBe('obj2');
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
	test('mc.merge(String, Number)', () => {
		const obj1 = 'obj1';
		const obj2 = 2;

		const result = mc.merge(obj1, obj2);

		expect(result).toBe(2);
		expect(result === obj1).toBe(false);
		expect(result === obj2).toBe(true);
	});
});
