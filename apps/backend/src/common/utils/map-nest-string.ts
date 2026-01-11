type MapNestedStringOptions = { lowercase?: boolean; toObject?: boolean };
type NestedObject = Record<string, unknown>;

/**
 * Recursively maps and flattens the keys of a nested object into a single level object with keys joined by a specified separator. Optionally
 * transforms keys to lowercase or uppercase.
 *
 * @example
 * 	mapNestedString({ a: { b: { c: 1 } } }) => { "a.b.c": 1 }
 * 	mapNestedString({ a: { b: { c: 1 } } }, "__") => { "a__b__c": 1 }
 * 	mapNestedString({ a: { b: { c: 1 } } }, ".", { lowercase: true }) => { "a.b.c": 1 }
 * 	mapNestedString({ a: { b: { c: 1 } } }, ".", { toObject: false }) => { "a.b.c": 1 }
 * 	mapNestedString({ a: { b: { c: 1 } } }, ".", { lowercase: true, toObject: false }) => { "a.b.c": 1 }
 * 	mapNestedString({ a: { b: { c: 1 } } }, ".", { lowercase: true, toObject: true }) => { a: { b: { c: 1 } } }
 *
 * @param object
 * @param separator
 * @param opts
 * @returns
 */
export function mapNestString<T extends NestedObject>(object: NestedObject, separator?: string, opts?: MapNestedStringOptions): T {
	separator ??= ".";
	opts ??= { lowercase: false, toObject: true };

	if (opts?.toObject === null || opts?.toObject === undefined) opts.toObject = true;

	if (opts?.lowercase === null || opts?.lowercase === undefined) opts.lowercase = false;

	const returnResult: NestedObject = {};
	const processKey = (key: string) => (opts.lowercase ? key.toLowerCase() : key);

	if (!opts.toObject) {
		Object.entries(object).forEach(([key, value]) => {
			const newKey = key.includes(separator) ? key.replaceAll(separator, ".") : key;
			returnResult[processKey(newKey)] = value;
		});
		return returnResult as T;
	}

	Object.entries(object).forEach(([key, value]) => {
		if (!key.includes(separator)) return (returnResult[processKey(key)] = value);
		const keys = key.split(separator).map(processKey);
		const inner = keys.pop()!;

		let objectToAssign: Record<string, unknown> = returnResult;
		keys.forEach((k) => {
			objectToAssign[k] ??= {};
			objectToAssign = objectToAssign[k] as Record<string, unknown>;
		});

		Object.assign(objectToAssign, { ...(objectToAssign as object), [inner]: value });
	});

	return returnResult as T;
}
