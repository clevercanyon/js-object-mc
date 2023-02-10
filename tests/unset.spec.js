const mc = require('../src/index.js');

describe('Test mc.u.unset()', () => {
	test('unset property', () => {
		const obj = {
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
		mc.u.unset(obj, 'e.f.g[0].h[0]');
		expect(obj.e.f.g[0].h[0]).toEqual({'2': 2});
		expect(obj.e.f.g[0].h[1]).toBe(undefined);
	});
	test('unset properties using *', () => {
		const obj = {
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
						() => 'function',
					],
					i: () => 'function',
				},
			},
			j: () => 'function',
		};
		mc.u.unset(obj, 'e.f.g[0].*');
		expect(obj.e.f.g[0]).toEqual({});

		mc.u.unset(obj, 'e.f.g.*');
		expect(obj.e.f.g).toEqual([]);

		mc.u.unset(obj, 'e.f.*');
		expect(obj.e.f).toEqual({});

		mc.u.unset(obj, 'j.*');
		expect('j' in obj).toBe(true);
		expect(typeof obj.j).toBe('function');
	});
});
