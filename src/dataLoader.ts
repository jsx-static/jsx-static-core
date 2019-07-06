import * as path from "path"

import { BuildConfig } from "./config"
import { getPath } from "./util/file"
import { error } from "./error"

function genData(config: BuildConfig): any { // data is implicitly arbitrary therefore any
  return new Promise((res, rej) => {
    config.fs.readFile(path.join(getPath(config.dataDir), config.dataEntry), "utf8", (err: any, data: string) => {
      if(err) {
        (error(err))
        res({})
      }
      else res(eval(data))
    })
  })
}

export {
  genData
}