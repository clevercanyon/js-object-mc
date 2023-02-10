const mc = require('../src/index.js');

describe('Test mc.u.toPlain()', () => {
	test('convert to plain object', () => {
		class Custom {
			constructor(values = {}) {
				this.values = values;
			}
			[mc.methods.toPlain]() {
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
		const flatObj = mc.u.toPlain(customObj);

		expect(flatObj).toStrictEqual({
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
		expect(flatObj === values).toBe(false);
	});
	test('convert to plain object deeply', () => {
		class Custom {
			constructor(values = {}) {
				this.values = values;
			}
			[mc.methods.toPlain]() {
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
		const flatObj = mc.u.toPlain(customObj, true);

		expect(flatObj).toStrictEqual({
			'1': 1,
			a: 'a',
			b: 'b',
			c: {
				d1: {},
				d2: {},
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
			j: {k: 'k'},
			l: [{m: 'm'}],
		});
		expect(flatObj === values).toBe(false);
	});
});
