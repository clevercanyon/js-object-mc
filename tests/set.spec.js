const mc = require('../src/index.js');

describe('Test mc.u.set()', () => {
	test('set property', () => {
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
		mc.u.set(obj, 'e.f.g[0].h[0]', 2);
		expect(obj.e.f.g[0].h[0]).toBe(2);
	});
});
