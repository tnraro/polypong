export function delta(a: unknown, b: unknown): unknown {
  if (typeof a === "number" && typeof b === "number"
    || typeof a === "string" && typeof b === "string"
    || typeof a === "boolean" && typeof b === "boolean"
  ) {
    if (a === b) return;
    return b;
  }
  if (typeof a === "object" && typeof b === "object") {
    if (a == null || b == null) return;

    if (Array.isArray(a) && Array.isArray(b)) {
      const result: unknown[] = [];
      for (let i = 0; i < b.length; i++) {
        result.push(delta(a[i], b[i]));
      }
      return result;
    }

    const ak = Object.keys(a);
    const bk = Object.keys(b);

    if (ak.length !== bk.length) throw new Error("delta doesn't support deleting props");

    const result: Record<string, unknown> = {};
    for (const key of ak) {
      const dt = delta((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]);
      if (dt != null)
        result[key] = dt;
    }
    return result;
  }
  return b;
}

export function assign(a: unknown, b: unknown): unknown {
  if (typeof a === "number" && typeof b === "number"
    || typeof a === "string" && typeof b === "string"
    || typeof a === "boolean" && typeof b === "boolean"
  ) {
    return b;
  }
  if (typeof a === "object" && typeof b === "object") {
    if (a == null || b == null) return;

    if (Array.isArray(a) && Array.isArray(b)) {
      const result: unknown[] = [];
      for (let i = 0; i < b.length; i++) {
        result.push(assign(a[i], b[i]));
      }
      return result;
    }
    const ak = Object.keys(a);

    const result: Record<string, unknown> = Object.assign(a);
    for (const key of ak) {
      const o = assign((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]);
      if (o != null)
        result[key] = o;
    }
    return result;
  }
  return b;
}