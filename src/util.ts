export function isClass(func) {
  try {
    func() // classes cannot be called as functions
    return false
  } catch {
    return true
  }
}