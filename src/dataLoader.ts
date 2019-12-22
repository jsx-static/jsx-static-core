import * as path from "path"

import { BuildConfig } from "./config"
import { getPath } from "./util/file"

function genData(config: BuildConfig): any { // data is implicitly arbitrary therefore any, should prob be an object tho
  return new Promise((res, rej) => {
    config.fs.readFile(path.join(getPath(config.dataDir), config.dataEntry), "utf8", (err: any, data: string) => {
      if(err) {
        // (error(err)) // in theory this can be done without data
        res({})
      }
      else res(eval(data))
    })
  })
}

export {
  genData
}