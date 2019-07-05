import * as fs from "fs"
import * as path from "path"

import recursive from "recursive-readdir"
import webpack from "webpack"
import MemFS from "memory-fs"
import ReactDOMServer from "react-dom/server"

import { error } from "./error"
import { getPath } from "./util"
import { BuildConfig, defaultBuildConfig, genWebpackConfig } from "./config"

function build(config: BuildConfig) {
  const mfs = new MemFS()
  
  return new Promise((res, rej) => {
    const start = new Date().getTime()

    if(!config && !fs.existsSync(getPath("jsxs.config.json"))) config = defaultBuildConfig
    
    recursive(getPath(config.siteDir), (err, files) => {
      if(err) rej(error(err))
      
      const packer = webpack(genWebpackConfig(config, files.reduce((acc: any, cur, i) => { acc[i] = cur; return acc }, {})))
      packer.outputFileSystem = mfs
      
      packer.run((err, stats) => {
        for(let i = 0; i < files.length; i++) {
          if(stats.hasErrors()) rej(error(stats.toJson().errors))
          //@ts-ignore // outputFileSystem.data is not a thing
          const compiled = eval(packer.outputFileSystem.data[`temp${i}`].toString())
          const outFile = files[i].split(config.siteDir.replace(/\/|\\/, ""))[1].replace(".jsx", ".html")
          fs.writeFile(getPath(path.join(config.outputDir, outFile)), ReactDOMServer.renderToString(compiled.default()), (err) => {})
        }
      })
    })
  })
}

export {
  build
}