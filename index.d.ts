export type Kinds = 'merge' | 'patch' | 'update';
export type PlainObject = { [x: string ]: unknown };
export type AnyObject = { [x: string | number ]: unknown };

export type Methods = {
	toPlain: unique symbol;
	toFlat: unique symbol;
	toOperation: unique symbol;
};
export type Utilities = {
	get: (node: unknown, path: string | number | Array<string | number>, defaultValue?: unknown, separator?: string) => unknown;
	defaultTo: (node: unknown, path: string | number | Array<string | number>, value: unknown, separator?: string) => unknown;

	set: (node: unknown, path: string | number | Array<string | number>, value: unknown, keepExisting_or_separator?: boolean | string, separator?: string) => unknown;
	unset: (node: unknown, path: string | number | Array<string | number>, separator?: string) => unknown;

	toPlain: (value: unknown, deep?: boolean) => unknown;
	toFlat: (value: unknown, path?: string, separator?: string, clearUndefined?: boolean) => unknown;

	diff: (value: unknown, compare: unknown, opts?: {
		separator?: string;
		path?: string | number;
		white?: Array<string | number>;
		ignore?: Array<string | number>;
		equal?: (a: unknown, b: unknown) => boolean;
	}) => unknown;

	matches: (value: unknown, conditions?: unknown, data?: AnyObject, separator?: string, errors?: unknown[]) => boolean;
	equals: (valueA: unknown, valueB: unknown) => boolean;

	type: (value: unknown) => string;
	types: (value: unknown) => string[];
	hasType: (value: unknown, className: string) => boolean;

	splitPath: (path: string | number | Array<string | number>, separator?: string) => Array<string | number>;
};
export type MergeCallback = (first: unknown, second: unknown, kind: KINDS) => unknown;
export type OperationCallback = (source: unknown, params: unknown, separator?: string) => boolean;

export const KINDS: Kinds;
export const methods: Methods;

export const u: Utilities;
export const utils: Utilities;
export const utilities: Utilities;

export function merge(...values: unknown): unknown;
export function patch(...values: unknown): unknown;
export function update(...values: unknown): unknown;

export function addMerge(type1: string, type2: string, callback: MergeCallback): MergeCallback | undefined;
export function addOperation(name: string, callback: OperationCallback): OperationCallback | undefined;
