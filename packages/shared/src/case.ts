/**
 * DB(snake_case) ↔ TS(camelCase) 키 변환. 값은 바꾸지 않고 키만 재귀적으로 바꾼다.
 * jsonb 컬럼 안의 키도 함께 바뀌므로, 원문 그대로 보존해야 하는 jsonb는 변환 전에 분리한다.
 */
type SnakeToCamel<S extends string> = S extends `${infer H}_${infer T}`
  ? `${H}${Capitalize<SnakeToCamel<T>>}`
  : S;

type CamelToSnake<S extends string> = S extends `${infer C}${infer R}`
  ? C extends Lowercase<C>
    ? `${C}${CamelToSnake<R>}`
    : `_${Lowercase<C>}${CamelToSnake<R>}`
  : S;

export type CamelKeys<T> = T extends readonly (infer U)[]
  ? CamelKeys<U>[]
  : T extends Date
    ? T
    : T extends object
      ? { [K in keyof T as K extends string ? SnakeToCamel<K> : K]: CamelKeys<T[K]> }
      : T;

export type SnakeKeys<T> = T extends readonly (infer U)[]
  ? SnakeKeys<U>[]
  : T extends Date
    ? T
    : T extends object
      ? { [K in keyof T as K extends string ? CamelToSnake<K> : K]: SnakeKeys<T[K]> }
      : T;

const snakeToCamel = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const camelToSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

function mapKeys(value: unknown, fn: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => mapKeys(v, fn));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [fn(k), mapKeys(v, fn)]));
  }
  return value;
}

export function toCamel<T>(value: T): CamelKeys<T> {
  return mapKeys(value, snakeToCamel) as CamelKeys<T>;
}

export function toSnake<T>(value: T): SnakeKeys<T> {
  return mapKeys(value, camelToSnake) as SnakeKeys<T>;
}
