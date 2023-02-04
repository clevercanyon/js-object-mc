export type Kinds = 'merge' | 'patch' | 'update';
export type PlainObject = { [x: string ]: unknown };
export type AnyObject = { [x: string | number ]: unknown };

export type Methods = {
	toPlain: unique symbol;
	toFlat: unique symbol;
	toOperation: unique symbol;
};
export type Utilities = {
	get: (obj: AnyObject, path: string | number, defaultValue?: unknown, separator?: string) => unknown;
	set: (obj: AnyObject, path: string | number, value: unknown, keepExisting_or_separator?: boolean | string, separator?: string) => unknown;
	setDefault: (obj: AnyObject, path: string | number, value: unknown, separator?: string) => unknown;
	unset: (obj: AnyObject, path: string | number, separator?: string) => unknown;

	plain: (value: AnyObject, recursive?: boolean) => AnyObject;
	flatten: (value: AnyObject, separator?: string, clearUndefined?: boolean) => PlainObject;

	diff: (value: AnyObject, compare: AnyObject, opts?: {
		separator?: string;
		path?: string | number;
		white?: Array<string | number>;
		ignore?: Array<string | number>;
		equal?: (a: unknown, b: unknown) => boolean;
	}) => PlainObject;
	matches: (value: AnyObject, conditions: AnyObject, data?: AnyObject, separator?: string, errors?: unknown[]) => boolean;

	type: (value: unknown) => string;
	typeList: (value: unknown) => string[];

	equals: (valueA: unknown, valueB: unknown) => boolean;
	instanceof: (value: unknown, className: string) => boolean;

	splitPath: (path: string | number | Array<string|number>, separator?: string) => Array<string | number>;

	// Utility aliases.
	equal: (valueA: unknown, valueB: unknown) => boolean;
	flat: (value: AnyObject, separator?: string, clearUndefined?: boolean) => PlainObject;
	match: (value: AnyObject, conditions: AnyObject, data?: AnyObject, separator?: string, errors?: unknown[]) => boolean;
};
export type MergeCallback = (first: AnyObject, second: AnyObject, kind: KINDS) => AnyObject;
export type OperationCallback = (source: AnyObject, params: AnyObject, separator?: string) => boolean;

export const KINDS: Kinds;
export const methods: Methods;

export const u: Utilities;
export const utils: Utilities;
export const utilities: Utilities;

export function merge(...values: AnyObject): AnyObject;
export function patch(...values: AnyObject): AnyObject;
export function update(...values: AnyObject): AnyObject;

export function addMerge(type1: string, type2: string, callback: MergeCallback): MergeCallback | undefined;
export function addOperation(name: string, callback: OperationCallback): OperationCallback | undefined;
