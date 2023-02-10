const mc = require('../src/index.js');

describe('Test mc.u.toOperable()', () => {
	test('convert to operable object', () => {
		class Custom {
			constructor(values = {}) {
				this.values = values;
			}
			[mc.methods.toOperable]() {
				return this.values;
			}
		}
		const values = {
			'1': 1,
			a: 'a',
			b: 'b',
			c: {
				d1: new URL('https://foo'),
				d2: new Date('2023-01-01'),
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
			j: new Custom({k: 'k'}),
			l: [new Custom({m: 'm'})],
		};
		const customObj = new Custom(values);
		const operableObj = mc.u.toOperable(customObj);

		expect(operableObj).toStrictEqual({
			'1': 1,
			a: 'a',
			b: 'b',
			c: {
				d1: new URL('https://foo'),
				d2: new Date('2023-01-01'),
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
			j: new Custom({k: 'k'}),
			l: [new Custom({m: 'm'})],
		});
		expect(operableObj === values).toBe(true);
	});
});
