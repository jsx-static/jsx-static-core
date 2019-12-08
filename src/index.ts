import * as nfs from "fs"
import * as path from "path"

//@ts-ignore // recursive-readdir-ext doesn't have a type declaration in @types
import recursive from "recursive-readdir-ext"
import webpack from "webpack"
import WebpackDevServer from "webpack-dev-server"
import MemFS from "memory-fs"

import { error } from "./error"
import { getPath, setRoot, setPostProcess, postProcess } from "./util/file"
import { defaultBuildConfig, genWebpackConfig, getConfig, BuildConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { writeFiles, FileOutput } from "./compiler"
import { genData } from "./dataLoader"

import chokidar from "chokidar"

function configRoot(mfs: boolean) {
  if(mfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))
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

      const webpackCompiler = webpack(config.webpackConfig || genWebpackConfig(config, files.reduce((acc: any, cur, i) => { acc[i] = cur; return acc }, {})))

      webpackCompiler.inputFileSystem = config.fs
      webpackCompiler.outputFileSystem = mfs

      const data = genData(config)
      webpackCompiler.run((err, stats) => {
        Promise.all([data]).then(([data]) => {
          if(stats.hasErrors()) return rej(error(stats.toJson().errors))
          const output: FileOutput[] = files.map((f, i) => ({
            //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
            source: webpackCompiler.outputFileSystem.data[`temp${i}`].toString(),
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
      files.filter(f => f.indexOf(".jsx") !== -1)

      if(err) return rej(error(err))
      if(files.length === 0) return rej(error({ msg: "no files in site" }))
      
      files = files.map(f => postProcess(f))
      
      const webpackConfig = genWebpackConfig(config, files)
      const webpackCompiler = webpack(webpackConfig)
      
      webpackCompiler.inputFileSystem = config.fs
      webpackCompiler.outputFileSystem = mfs
      let server = new WebpackDevServer(webpackCompiler, {
        hot: true,
      })
    })
  })
}

export {
  build,
  watch,
}