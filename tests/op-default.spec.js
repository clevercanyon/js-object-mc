const mc = require('../src/index.js');

describe('Test mc.merge() with $default(s)', () => {
	test('$default with $propSortOrder', () => {
		const obj1 = {
			a: undefined,
			b: 'B',
		};
		const obj2 = {
			$default: {
				b: 'b',
				a: 'a',
				c: 'c',
			},
			$propSortOrder: ['a', 'b', 'c'],
		};
		const merged = mc.merge(obj1, obj2);
		expect(JSON.stringify(merged, null, 4)).toBe(
			JSON.stringify({a: 'a', b: 'B', c: 'c'}, null, 4)
		);
	});
	test('$default with $propSortOrder', () => {
		const obj1 = {
			a: undefined,
			b: 'B',
		};
		const obj2 = {
			$ꓺdefault: {
				b: 'b',
				a: 'a',
				c: 'c',
			},
			$propSortOrder: ['a', 'b', 'c'],
		};
		const merged = mc.merge(obj1, obj2);
		expect(JSON.stringify(merged, null, 4)).toBe(
			JSON.stringify({a: 'a', b: 'B', c: 'c'}, null, 4)
		);
	});
	test('$defaults with $propSortOrder', () => {
		const obj1 = {
			a: undefined,
			b: 'B',
		};
		const obj2 = {
			$defaults: {
				b: 'b',
				a: 'a',
				c: 'c',
			},
			$propSortOrder: ['a', 'b', 'c'],
		};
		const merged = mc.merge(obj1, obj2);
		expect(JSON.stringify(merged, null, 4)).toBe(
			JSON.stringify({a: 'a', b: 'B', c: 'c'}, null, 4)
		);
	});
	test('$ꓺdefaults with $propSortOrder', () => {
		const obj1 = {
			a: undefined,
			b: 'B',
		};
		const obj2 = {
			$ꓺdefaults: {
				b: 'b',
				a: 'a',
				c: 'c',
			},
			$propSortOrder: ['a', 'b', 'c'],
		};
		const merged = mc.merge(obj1, obj2);
		expect(JSON.stringify(merged, null, 4)).toBe(
			JSON.stringify({a: 'a', b: 'B', c: 'c'}, null, 4)
		);
	});
});
