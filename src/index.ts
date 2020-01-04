import { genSiteWebpack, JsxsConfig, getJsxsConfig, genDataWebpack } from "./config"
import { genHTML } from "./compiler"
import path from "path"
import webpack from "webpack"
import MemoryFileSystem from "memory-fs"
import fs from "fs"

function prepareWorkspace(config: JsxsConfig) {
  function create(dir: string, fs: any) {
    if(!config.inputFs.existsSync(path.join(config.inRoot, dir))) {
      console.log(`${dir} not found, creating ${dir}`)
      config.inputFs.mkdir(path.join(config.inRoot, dir), err => { if(err) console.error(`failed to create ${dir}`) })
    }
  }

  create(config.outputDir, config.outputFs)
  create(config.componentDir, config.inputFs)
  create(config.dataDir, config.inputFs)
  create(config.siteDir, config.inputFs)
}

let dataCache = {}
function buildDir(dir: any, dirName: string, stats: webpack.Stats, config: JsxsConfig) {
  for(let file in dir) {
    if(path.extname(file) === ".html" && dir[file] instanceof Buffer) {
      const filepath = (() => {
        const lpath = config.outputFs === fs ? path : path.posix
        return lpath.join(config.outRoot, config.outputDir, dirName, file).replace(/\\/, "/").replace(".jsx", ".html")
      })()
      const outputDir = path.dirname(filepath)
      if(!config.outputFs.existsSync(outputDir)) config.outputFs.mkdirSync(outputDir, { recursive: true })
      config.outputFs.writeFileSync(filepath, genHTML(config, file, dir[file].toString(), dataCache))
    } else {
      if(!(dir[file] instanceof Buffer)) {
        buildDir(dir[file], path.join(dirName, file), stats, config)
      }
    }
  }
}

const buildCallback = (err: any, stats: webpack.Stats, config: JsxsConfig, isData: boolean) => {
  if(err) console.error(err)
  else if(stats.hasErrors()) console.error(stats.toString())
  else {
    if(isData) {
      //@ts-ignore // data isn't normally a part of a fs but in this case it is because it will always be memfs
      dataCache = eval(stats.compilation.compiler.outputFileSystem.data["__jsxs_data__.js"].toString()).default
      if(config.hooks && config.hooks.postDataEmit) config.hooks.postDataEmit()
    }
    //@ts-ignore // ^
    buildDir(stats.compilation.compiler.outputFileSystem.data, "", stats, config)
    if(config.hooks && config.hooks.postSiteEmit) config.hooks.postSiteEmit()
  }
}

export function watch(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  prepareWorkspace(config)
  const outputFs = new MemoryFileSystem()
  const packer = genSiteWebpack(config, outputFs)
  const dataCompiler = genDataWebpack(config, outputFs)
  
  return [
    dataCompiler.watch({}, (err, stats) => buildCallback(err, stats, config, true)),
    packer.watch({}, (err, stats) => buildCallback(err, stats, config, false))
  ]
}

export function build(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  const outputFs = new MemoryFileSystem()

  const packer = genSiteWebpack(config, outputFs)
  const dataCompiler = genDataWebpack(config, outputFs)

  prepareWorkspace(config)
  return new Promise((res, rej) => {
    dataCompiler.run((err, stats) => {
      //TODO: figure out a way to distinguish between actually fatal errors
      if(err) console.log(err) // technically the data stage can fail if the entry does not exist
      buildCallback(err, stats, config, true)
      packer.run((err, stats) => {
        if(err) rej(err)
        if(stats.hasErrors()) rej(stats.toString())
        else {
          buildCallback(err, stats, config, false)
          res()
        }
      })
    })
  })
}

export default {
  build,
  watch
}