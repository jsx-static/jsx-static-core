import * as path from "path"

function getPath(p: string): string {
  return path.join(path.resolve("."), p)
}

export {
  getPath
}