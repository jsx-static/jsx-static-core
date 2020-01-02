import { JsxsConfig } from "./config"
import path from "path"
import webpack from "webpack"

export function getData(config: JsxsConfig): any {
  const entry = path.join(config.inRoot, config.dataDir, config.dataEntry)
  for(let module in Object.keys(require.cache).filter(m => m.indexOf(path.join(config.inRoot, config.dataDir)) !== -1)) {
    delete require.cache[module] // empty the node cache
  }
  return require(entry)
}