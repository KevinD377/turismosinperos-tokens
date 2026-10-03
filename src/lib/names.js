export function camel(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, next) => next.toUpperCase());
}
