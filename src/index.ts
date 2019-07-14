import * as nfs from "fs"
import * as path from "path"

//@ts-ignore // recursive-readdir-ext doesn't have a type declaration in @types
import recursive from "recursive-readdir-ext"
import webpack from "webpack"
import MemFS from "memory-fs"

import { error } from "./error"
import { getPath, setRoot, setPostProcess, postProcess } from "./util/file"
import { defaultBuildConfig, genWebpackConfig, getConfig, BuildConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { genHTML } from "./compiler"
import { genData } from "./dataLoader"

import chokidar from "chokidar"

function configRoot(mfs: boolean) {
  if(mfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))
}

interface FileOutput {
  source: string,
  name: string
}

function writeFiles(files: FileOutput[], config: BuildConfig, data: any) {
  for(let i = 0; i < files.length; i++) {
    const compiled = eval(files[i].source)
    const outFile = path.basename(files[i].name).replace(".jsx", ".html")
    const compiledPages = genHTML(compiled, data, outFile)
    for(let i = 0; i < compiledPages.length; i++) {
      config.fs.writeFileSync(getPath(path.join(config.outputDir, compiledPages[i].filename)), compiledPages[i].html)
    }
  }
}

function build(params: any, memfs?: boolean) {
  configRoot(!!memfs)
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
          if(stats.hasErrors()) return rej(error(stats.toJson().errors))
          const output: FileOutput[] = files.map((f, i) => ({
            //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
            source: packer.outputFileSystem.data[`temp${i}`].toString(),
            name: path.basename(f).replace(".jsx", ".html")
          }))
          
          writeFiles(output, config, data)
          res()
        })
      })
    })
  })
}

function watch(params: any, memfs?: boolean) {
  configRoot(!!memfs)

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
          if(stats.hasErrors()) return rej(error(stats.toJson().errors))
          const output: FileOutput[] = files.map((f, i) => ({
            //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
            source: packer.outputFileSystem.data[`temp${i}`].toString(),
            name: path.basename(f).replace(".jsx", ".html")
          }))
          
          writeFiles(output, config, data)
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