import { getPacker, JsxsConfig, getJsxsConfig } from "./config"
import { compilePage } from "./compiler"
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

let dataCache = {
  evaluated: {},
  src: null
}

function buildDir(dir: any, dirName: string, stats: webpack.Stats, config: JsxsConfig) {
  for(let file in dir) {
    if(path.extname(file) === ".html" && dir[file] instanceof Buffer) {
      const outputDir = path.posix.dirname(path.posix.join(config.outRoot, config.outputDir, dirName, file).replace(/\\/, "/").replace(".jsx", ".html"))
      
      if(!config.outputFs.existsSync(outputDir)) config.outputFs.mkdirSync(outputDir, { recursive: true })
      const outputPages = compilePage(config, file, dir[file].toString(), dataCache.evaluated)
      outputPages.forEach(page => {
        if(!config.outputFs.existsSync(path.posix.join(outputDir, path.dirname(page.filename)))) config.outputFs.mkdirSync(path.posix.join(outputDir, path.dirname(page.filename)), { recursive: true })
        config.outputFs.writeFileSync(path.posix.join(outputDir, page.filename), (config.hooks && config.hooks.postProcess) ? config.hooks.postProcess(page.html) : page.html)
      })
    } else {
      if(!(dir[file] instanceof Buffer)) {
        buildDir(dir[file], path.join(dirName, file), stats, config)
      }
    }
  }
}

const buildCallback = (err: any, stats: webpack.Stats, config: JsxsConfig) => {
  if(err) console.error(err)
  else if(stats.hasErrors()) console.error(stats.toString())
  else {
    //@ts-ignore // data isn't normally a part of a fs but in this case it is because it will always be memfs
    if(stats.compilation.compiler.outputFileSystem.data["__jsxs_data__.js"] && dataCache.src !== stats.compilation.compiler.outputFileSystem.data["__jsxs_data__.js"].toString()) {
      //@ts-ignore // ^
      dataCache.src = stats.compilation.compiler.outputFileSystem.data["__jsxs_data__.js"].toString()
      try {
        dataCache.evaluated = eval(dataCache.src).default
        if(config.hooks && config.hooks.postDataEmit) config.hooks.postDataEmit()
      } catch(err) {
        console.error(`data failed to compile`)
      }
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
  const packer = getPacker(config, outputFs)
  
  return [
    packer.watch({}, (err, stats) => buildCallback(err, stats, config))
  ]
}

export function build(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  const outputFs = new MemoryFileSystem()

  const packer = getPacker(config, outputFs)

  prepareWorkspace(config)
  return new Promise((res, rej) => {
    packer.run((err, stats) => {
      if(err) rej(err)
      if(stats.hasErrors()) rej(stats.toString())
      else {
        buildCallback(err, stats, config)
        res()
      }
    })
  })
}

export default {
  build,
  watch
}