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
						new Date('2023-01-01'),
					],
				},
			},
			i: [0],
			j: new URL('https://foo/'),
			k: new Date('2023-01-01'),
		};
		const flat = mc.u.toFlat(obj);
		expect(flat).toStrictEqual({
			'1': 1,
			a: 'a',
			b: 'b',
			'c.d': 'd',
			'e.f.g[0].h[0]': 1,
			'e.f.g[0].h[1].2': 2,
			'e.f.g[1]': new Date('2023-01-01'),
			'i[0]': 0,
			j: new URL('https://foo/'),
			k: new Date('2023-01-01'),
		});
	});
});
