const mc = require('../src/index.js');

describe('Test mc.merge() with $propSortOrder', () => {
	test('$default with $propSortOrder', () => {
		const obj1 = {};
		const obj2 = {
			$default: {
				b: 'b',
				a: 'a',
				c: 'c',
			},
			$propSortOrder: ['a', 'b', 'c'],
		};
		const merged = mc.merge(obj1, obj2);
		expect(JSON.stringify(merged, null, 4)).toBe(JSON.stringify({ a: 'a', b: 'b', c: 'c' }, null, 4));
	});
	test('$propSortOrder from README file', () => {
		const obj1 = {
			prop3: {
				c: {
					d: 'd',
				},
				b: 'b',
				e: undefined,
			},
			prop00: '00',
			prop1: ['a', 'b', 'c'],
			a: 'a',
			prop2: ['a', 'b', 'c'],
		};
		const obj2 = {
			prop4: '4',
			$propSortOrder: [
				'a',
				'prop0',
				'prop1',
				'prop2',
				'prop3.b',
				'prop3.c.d',
				'prop3.e', // Undefined. Will not appear in sorted object.
				'prop4',
			],
			prop0: '0',
			prop00: '00', // Not in sort order given, so comes after all others.
		};
		const merged = mc.merge(obj1, obj2);
		expect(JSON.stringify(merged, null, 4)).toBe(
			JSON.stringify(
				{
					'a': 'a',
					'prop0': '0',
					'prop1': ['a', 'b', 'c'],
					'prop2': ['a', 'b', 'c'],
					'prop3': {
						'b': 'b',
						'c': {
							'd': 'd',
						},
					},
					'prop4': '4',
					'prop00': '00',
				},
				null,
				4,
			),
		);
	});
	test('$ꓺdefault with $ꓺpropSortOrder', () => {
		const obj1 = {};
		const obj2 = {
			'$ꓺdefault': {
				'author': {
					'name': 'Owner',
					'url': 'https://owner.com',
				},
				'bin': {},
				'browser': '',
				'bugs': 'https://github.com/owner/project/issues',
				'bundleDependencies': [],
				'configꓺownerꓺ&ꓺbuildꓺappType': 'cma',
				'configꓺownerꓺ&ꓺbuildꓺtargetEnv': 'any',
				'configꓺownerꓺ&ꓺdotfilesꓺlock': [],
				'configꓺownerꓺ&ꓺgithubꓺconfigVersion': '',
				'configꓺownerꓺ&ꓺgithubꓺenvsVersion': '',
				'configꓺownerꓺ&ꓺgithubꓺlabels': {},
				'configꓺownerꓺ&ꓺgithubꓺteams': {},
				'configꓺownerꓺ&ꓺnpmjsꓺconfigVersions': '',
				'contributors': [],
				'cpu': [],
				'dependencies': {},
				'description': 'Another great project by Owner.',
				'devDependencies': {},
				'devDependenciesꓺ@owner/dev-deps': '*',
				'engines': {},
				'exports': null,
				'files': [],
				'funding': 'https://github.com/sponsors/owner',
				'homepage': 'https://github.com/owner/project#readme',
				'imports': {},
				'keywords': ['keyword'],
				'license': 'GPL-3.0',
				'main': '',
				'module': '',
				'name': '@owner/project',
				'optionalDependencies': {},
				'os': [],
				'overrides': {},
				'peerDependencies': {},
				'peerDependenciesMeta': {},
				'private': true,
				'publishConfigꓺaccess': 'restricted',
				'repository': 'https://github.com/owner/project',
				'sideEffects': [],
				'type': 'module',
				'types': '',
				'typesVersions': {},
				'unpkg': '',
				'version': '1.0.0',
				'workspaces': [],
			},
			'$ꓺset': {
				'funding': 'https://github.com/sponsors/owner',
				'workspaces': [],

				'cpu': ['x64', 'arm64'],
				'os': ['darwin', 'linux'],
				'engines': {
					'node': '^19.2.0 || ^19.4.0',
					'npm': '^8.19.3 || ^9.2.0',
				},
			},
			'$ꓺunset': ['typings', 'scripts'],

			'$ꓺpropSortOrder': [
				'private',
				'publishConfigꓺaccess',

				'version',
				'license',
				'name',
				'description',
				'repository',
				'homepage',
				'bugs',
				'funding',
				'keywords',

				'author',
				'contributors',

				'type',
				'files',
				'bin',
				'imports',
				'exports',
				'sideEffects',
				'module',
				'main',
				'browser',
				'unpkg',
				'types',
				'typesVersions',

				'dependencies',
				'peerDependencies',
				'peerDependenciesMeta',
				'optionalDependencies',
				'bundleDependencies',
				'devDependencies',

				'overrides',
				'workspaces',

				'cpu',
				'os',
				'enginesꓺnode',
				'enginesꓺnpm',

				'configꓺownerꓺ&ꓺdotfilesꓺlock',

				'configꓺownerꓺ&ꓺbuildꓺappType',
				'configꓺownerꓺ&ꓺbuildꓺtargetEnv',

				'configꓺownerꓺ&ꓺgithubꓺteams',
				'configꓺownerꓺ&ꓺgithubꓺlabels',
				'configꓺownerꓺ&ꓺgithubꓺconfigVersion',
				'configꓺownerꓺ&ꓺgithubꓺenvsVersion',

				'configꓺownerꓺ&ꓺnpmjsꓺconfigVersions',
			],
		};
		const pkg = mc.merge(obj1, obj2);
		expect(JSON.stringify(pkg, null, 4)).toBe(
			JSON.stringify(
				{
					'private': true,
					'publishConfig': {
						'access': 'restricted',
					},
					'version': '1.0.0',
					'license': 'GPL-3.0',
					'name': '@owner/project',
					'description': 'Another great project by Owner.',
					'repository': 'https://github.com/owner/project',
					'homepage': 'https://github.com/owner/project#readme',
					'bugs': 'https://github.com/owner/project/issues',
					'funding': 'https://github.com/sponsors/owner',
					'keywords': ['keyword'],
					'author': {
						'name': 'Owner',
						'url': 'https://owner.com',
					},
					'contributors': [],
					'type': 'module',
					'files': [],
					'bin': {},
					'imports': {},
					'exports': null,
					'sideEffects': [],
					'module': '',
					'main': '',
					'browser': '',
					'unpkg': '',
					'types': '',
					'typesVersions': {},
					'dependencies': {},
					'peerDependencies': {},
					'peerDependenciesMeta': {},
					'optionalDependencies': {},
					'bundleDependencies': [],
					'devDependencies': {
						'@owner/dev-deps': '*',
					},
					'overrides': {},
					'workspaces': [],
					'cpu': ['x64', 'arm64'],
					'os': ['darwin', 'linux'],
					'engines': {
						'node': '^19.2.0 || ^19.4.0',
						'npm': '^8.19.3 || ^9.2.0',
					},
					'config': {
						'owner': {
							'&': {
								'dotfiles': {
									'lock': [],
								},
								'build': {
									'appType': 'cma',
									'targetEnv': 'any',
								},
								'github': {
									'teams': {},
									'labels': {},
									'configVersion': '',
									'envsVersion': '',
								},
								'npmjs': {
									'configVersions': '',
								},
							},
						},
					},
				},
				null,
				4,
			),
		);
	});
});
