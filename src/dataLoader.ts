import * as fs from "fs"
import * as path from "path"

import { BuildConfig } from "./config"
import { getPath } from "./util"
import { error } from "./error"

function genData(config: BuildConfig): any { // data is implicitly arbitrary therefore any
  return new Promise((res, rej) => {
    fs.readFile(path.join(getPath(config.dataDir), config.dataEntry), "utf8", (err, data) => {
      if(err) rej(error(err))
      else res(eval(data))
    })
  })
}

export {
  genData
}