const mc = require('../src/index.js');

describe('Test mc.u.toFlat()', () => {
	test('convert to flat object', () => {
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
		const flat = mc.u.toFlat(obj);
		expect(flat).toEqual({
			'1': 1,
			a: 'a',
			b: 'b',
			'c.d': 'd',
			'e.f.g[0].h[0]': 1,
			'e.f.g[0].h[1].2': 2,
			'i[0]': 0,
		});
	});
});
