import * as path from "path"

function getPath(p: string): string {
  return path.join(path.resolve("."), p)
}

function isClass(val: any): boolean { // janky hack
  try {
    val() // classes cannot be called as though they are a function
    return false
  } catch { return true }
}

export {
  getPath,
  isClass
}