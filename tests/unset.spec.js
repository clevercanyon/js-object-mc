const mc = require('../index.js');

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
});
