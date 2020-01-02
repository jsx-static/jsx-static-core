import { JsxsConfig } from "./config"
import path from "path"


export function getData(config: JsxsConfig): any {
  delete require.cache[path.join(config.inRoot, config.dataDir, config.dataEntry)] // empty the node cache
  return require(path.join(config.inRoot, config.dataDir, config.dataEntry))
}