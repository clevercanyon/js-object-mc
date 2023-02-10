const mc = require('../src/index.js');

describe('Test mc.u.get()', () => {
	test('get property', () => {
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
		const h0 = mc.u.get(obj, 'e.f.g[0].h[0]');
		expect(h0).toBe(1);
	});
});
