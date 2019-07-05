import * as fs from "fs"
import * as path from "path"

import recursive from "recursive-readdir"
import webpack from "webpack"
import MemFS from "memory-fs"
import ReactDOMServer from "react-dom/server"

import { error } from "./error"
import { getPath } from "./util"
import { BuildConfig, defaultBuildConfig, genWebpackConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"

function build(config: BuildConfig) {
  const mfs = new MemFS()
  
  return new Promise((res, rej) => {
    if(!config && !fs.existsSync(getPath("jsxs.config.json"))) config = defaultBuildConfig
    else {
      config = JSON.parse(fs.readFileSync(getPath("jsxs.config.json"), "utf8"))
    }

    if(!testWorkspace(config)) return rej(error({ msg: "needed folders do not exist" }))
    prepareWorkspace(config)

    recursive(getPath(config.siteDir), (err, files) => {
      if(err) return rej(error(err))
      if(files.length === 0) return rej(error({ msg: "no files in site" }))
      
      const packer = webpack(config.webpackConfig || genWebpackConfig(config, files.reduce((acc: any, cur, i) => { acc[i] = cur; return acc }, {})))
      packer.outputFileSystem = mfs
      
      packer.run((err, stats) => {
        for(let i = 0; i < files.length; i++) {
          if(stats.hasErrors()) return rej(error(stats.toJson().errors))
          //@ts-ignore // outputFileSystem.data is not a thing
          const compiled = eval(packer.outputFileSystem.data[`temp${i}`].toString())
          const outFile = path.basename(files[i]).replace(".jsx", ".html")
          console.log(outFile)
          fs.writeFile(getPath(path.join(config.outputDir, outFile)), ReactDOMServer.renderToString(compiled.default()), (err) => {})
        }
      })
    })
  })
}

export {
  build
}