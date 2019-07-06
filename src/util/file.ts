import * as path from "path"
import { BuildConfig } from "../config"

let __root = ""
let postProcess = (str: any) => str

function getPath(p: string): string {
  return postProcess(path.join(__root, p))
}

function setRoot(root: string) {
  __root = root
}

function setPostProcess(fn: any) {
  postProcess = fn
}

export {
  getPath,
  setRoot,
  setPostProcess,
  postProcess
}