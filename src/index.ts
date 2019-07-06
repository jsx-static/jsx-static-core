import * as nfs from "fs"
import * as path from "path"

//@ts-ignore // recursive-readdir-ext doesn't have a type declaration in @types
import recursive from "recursive-readdir-ext"
import webpack from "webpack"
import MemFS from "memory-fs"
import ReactDOMServer from "react-dom/server"

import { error } from "./error"
import { getPath } from "./util"
import { BuildConfig, defaultBuildConfig, genWebpackConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { genHTML } from "./compiler"
import { genData } from "./dataLoader"


function build(config: BuildConfig) {
  const mfs = new MemFS()
  
  return new Promise((res, rej) => {
    if(!config && !nfs.existsSync(getPath("jsxs.config.json"))) config = defaultBuildConfig
    else {
      config = JSON.parse(nfs.readFileSync(getPath("jsxs.config.json"), "utf8"))
    }

    if(!testWorkspace(config)) return rej(error({ msg: "needed folders do not exist" }))
    prepareWorkspace(config)

    recursive(getPath(config.siteDir), { fs: config.fs }, (err, files) => {
      if(err) return rej(error(err))
      if(files.length === 0) return rej(error({ msg: "no files in site" }))
      
      const packer = webpack(config.webpackConfig || genWebpackConfig(config, files.reduce((acc: any, cur, i) => { acc[i] = cur; return acc }, {})))
      packer.outputFileSystem = mfs
      const data = genData(config)
      packer.run((err, stats) => {
        Promise.all([data]).then(([data]) => {
          for(let i = 0; i < files.length; i++) {
            if(stats.hasErrors()) return rej(error(stats.toJson().errors))
            //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
            const compiled = eval(packer.outputFileSystem.data[`temp${i}`].toString())
            const outFile = path.basename(files[i]).replace(".jsx", ".html")
            const compiledPages = genHTML(compiled, data, outFile)
            for(let i = 0; i < compiledPages.length; i++) {
              nfs.writeFile(getPath(path.join(config.outputDir, compiledPages[i].filename)), compiledPages[i].html, (err) => {})
            }
          }
        })
      })
    })
  })
}

export {
  build
}