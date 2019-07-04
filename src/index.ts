import * as path from "path"
import * as fs from "fs"

import { error } from "./error"

interface BuildConfig {
  siteDir: string
}

const defaultConfig: BuildConfig = {
  siteDir: "./site"
}

function build(config: BuildConfig) {
  return new Promise((res, rej) => {
    if(!config && !fs.existsSync(path.join(path.resolve("."), "jsxs.config.json"))) config = defaultConfig
    
    fs.readdir(path.join(path.resolve("."), config.siteDir), (err, files) => {
      if(err) return error(err)
      for(let i = 0; i < files.length; i++) {
        console.log(files)
      }
    })
  })
}

export {
  build
}