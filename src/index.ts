import * as nfs from "fs"
import * as path from "path"

import webpack from "webpack"
import MemFS from "memory-fs"

import { error } from "./error"
import { getPath, setRoot, setPostProcess, postProcess } from "./util/file"
import { defaultBuildConfig, genWebpackConfig, getConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { genHTML } from "./compiler"
import { genData } from "./dataLoader"

import reactDOMServer from "react-dom/server"

function build(params: any, memfs?: boolean) {
  if(memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()
  
  return new Promise((res, rej) => {
    const config = getConfig(params)
    const packer = webpack(config.webpackConfig || genWebpackConfig(config))
      
    packer.inputFileSystem = config.fs
    packer.outputFileSystem = mfs

    if(!testWorkspace(config)) return rej(error({ msg: "needed folders do not exist" }))
    prepareWorkspace(config)

    const data = genData(config)
    packer.run((err, stats) => {
      Promise.all([data]).then(([data]) => {
        for (let name in packer.outputFileSystem.data) {
          if(stats.hasErrors()) return rej(error(stats.toJson().errors))
          //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
          const compiled = eval(packer.outputFileSystem.data[`temp${i}`].toString())
          const outFile = path.basename(packer.outputFileSystem[name]).replace(".jsx", ".html")
          const compiledPages = genHTML(compiled, data, outFile)
          for(let i = 0; i < compiledPages.length; i++) {
            config.fs.writeFileSync(getPath(path.join(config.outputDir, compiledPages[i].filename)), compiledPages[i].html)
          }
        }
        res()
      })
    })
  })
}

function watch(params: any, memfs?: boolean) {
  if(memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()
  
  const config = getConfig(params)
  const packer = webpack(genWebpackConfig(config))
    
  packer.inputFileSystem = config.fs
  packer.outputFileSystem = mfs

  if(!testWorkspace(config)) {
    console.error("needed folders do not exist, making them")
    prepareWorkspace(config)
  }

  const data = genData(config)
  return packer.watch({}, (err, stats) => {
    Promise.all([data]).then(([data]) => {
      console.log("compiled")
      for (let name in packer.outputFileSystem.data) {
        if(stats.hasErrors()) console.error(stats.compilation.errors)
        //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
        const compiled = eval(packer.outputFileSystem.data[name].toString())
        const outFile = path.basename(name).replace(".jsx", ".html")
        const compiledPages = genHTML(compiled, data, outFile)
        console.log(compiledPages)
        for(let i = 0; i < compiledPages.length; i++) {
          config.fs.writeFileSync(path.join(path.resolve("."), config.outputDir, compiledPages[i].filename), compiledPages[i].html)
        }
      }
    })
  })
}

export {
  build,
  watch
}