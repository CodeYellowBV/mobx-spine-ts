// lodash's `snakeCase` method removes dots from the string; this breaks mobx-spine
export function camelToSnake(s: string): string {
    return s.replace(/([A-Z])/g, $1 => '_' + $1.toLowerCase());
}