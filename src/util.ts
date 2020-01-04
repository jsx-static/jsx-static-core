export function isReactClass(component: any): boolean {
  return !!(component.prototype && (component.prototype.isReactComponent || component.prototype.render))
}