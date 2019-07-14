import * as nfs from "fs"
import * as path from "path"

//@ts-ignore // recursive-readdir-ext doesn't have a type declaration in @types
import recursive from "recursive-readdir-ext"
import webpack from "webpack"
import MemFS from "memory-fs"

import { error } from "./error"
import { getPath, setRoot, setPostProcess, postProcess } from "./util/file"
import { defaultBuildConfig, genWebpackConfig, getConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { genHTML } from "./compiler"
import { genData } from "./dataLoader"

import chokidar from "chokidar"

function build(params: any, memfs?: boolean) {
  if(memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()
  
  return new Promise((res, rej) => {
    const config = getConfig(params)

    if(!testWorkspace(config)) return rej(error({ msg: "needed folders do not exist" }))
    prepareWorkspace(config)
    recursive(getPath(config.siteDir), {
      fs: config.fs
    }, (err: any, files: string[]) => {
      if(err) return rej(error(err))
      if(files.length === 0) return rej(error({ msg: "no files in site" }))
      
      files = files.map(f => postProcess(f))

      const packer = webpack(config.webpackConfig || genWebpackConfig(config, files.reduce((acc: any, cur, i) => { acc[i] = cur; return acc }, {})))
      
      packer.inputFileSystem = config.fs
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
              config.fs.writeFileSync(getPath(path.join(config.outputDir, compiledPages[i].filename)), compiledPages[i].html)
            }
          }
          res()
        })
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
  
  return new Promise((res, rej) => {
    const config = getConfig(params)
    if(!testWorkspace(config)) return rej(error({ msg: "needed folders do not exist" }))
    prepareWorkspace(config)
    recursive(getPath(config.siteDir), {
      fs: config.fs
    }, (err: any, files: string[]) => {
      if(err) return rej(error(err))
      if(files.length === 0) return rej(error({ msg: "no files in site" }))
      
      files = files.map(f => postProcess(f))

      const packer = webpack(config.webpackConfig || genWebpackConfig(config, files.reduce((acc: any, cur, i) => { acc[i] = cur; return acc }, {})))

      
      packer.inputFileSystem = config.fs
      packer.outputFileSystem = mfs
      
      const data = genData(config)
      packer.watch({}, (err, stats) => {
        Promise.all([data]).then(([data]) => {
          for(let i = 0; i < files.length; i++) {
            if(stats.hasErrors()) return rej(error(stats.toJson().errors))
            //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
            const compiled = eval(packer.outputFileSystem.data[`temp${i}`].toString())
            const outFile = path.basename(files[i]).replace(".jsx", ".html")
            const compiledPages = genHTML(compiled, data, outFile)
            for(let i = 0; i < compiledPages.length; i++) {
              config.fs.writeFileSync(getPath(path.join(config.outputDir, compiledPages[i].filename)), compiledPages[i].html)
            }
          }
          res()
        })
      })
    })
  })
}

export {
  build,
  watch
}