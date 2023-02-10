export type PlainObject = { [x: string ]: unknown };
export type AnyObject = { [x: string | number ]: unknown };

export type ObjectPath = string | number | Array<string | number>;
export type SplitObjectPath = Array<string | number>;

export type Kind = 'merge' | 'patch' | 'update';
export type Kinds = {
	MERGE: 'merge';
	PATCH: 'patch';
	UPDATE: 'update';
};
export type Methods = {
	toOperable: unique symbol;
	toPlain: unique symbol;
	toFlat: unique symbol;
};
export type Utilities = {
	type: (value: unknown) => string;
	types: (value: unknown) => string[];
	hasType: (value: unknown, className: string) => boolean;

	equals: (valueA: unknown, valueB: unknown) => boolean;
	isObject: (value: unknown) => boolean;
	isPrototypePollutionKey: (key: string) => boolean;

	clone: <T>(value: T, deep?: boolean) => T; // Uses Lodash.

	splitObjPath: (path: ObjectPath, separator?: string) => SplitObjectPath;
	get: (node: unknown, path: ObjectPath, defaultValue?: unknown, separator?: string) => unknown;
	set: (node: unknown, path: ObjectPath, value: unknown, keepExistingOrSeparator?: boolean | string, separator?: string) => void;
	defaultTo: (node: unknown, path: ObjectPath, value: unknown, separator?: string) => void;
	unset: (node: unknown, path: ObjectPath, separator?: string) => void;

	toOperable: (value: unknown) => unknown;
	toPlain: (value: unknown, deep?: boolean) => unknown;
	toFlat: (value: unknown, path?: string, separator?: string, clearUndefined?: boolean) => unknown;
	toDiff: (value: unknown, compare: unknown, opts?: {
		separator?: string;
		path?: string | number;
		white?: Array<string | number>;
		ignore?: Array<string | number>;
		equals?: (a: unknown, b: unknown) => boolean;
	}) => unknown;

	matches: (value: unknown, conditions?: unknown, data?: AnyObject, separator?: string, errors?: unknown[]) => boolean;
};
export type MergeCallback = (first: unknown, second: unknown, kind: Kind) => unknown;
export type OperationCallback = (source: unknown, params: unknown, separator?: string) => boolean;

declare class MergeChange {
	KINDS: Kinds;
	methods: Methods;

	u: Utilities;
	utils: Utilities;
	utilities: Utilities;

	constructor(); // Instance.
	newInstance(): MergeChange; // New instance.
	prepareMerge(kind: Kind): typeof merge | typeof patch | typeof update;

	merge<T>(source: T, ...merges: unknown): T;
	patch<T>(source: T, ...patches: unknown): T;
	update<T>(source: T, ...updates: unknown): T;

	addMerge(type1: string, type2: string, callback: MergeCallback): MergeCallback | undefined;
	addOperation(name: string, callback: OperationCallback): OperationCallback | undefined;
}
declare var mergeChangeInstance: MergeChange;
export = mergeChangeInstance; // Class instance.
