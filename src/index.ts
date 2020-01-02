import { genSiteWebpack, JsxsConfig, getJsxsConfig, genDataWebpack } from "./config"
import { genHTML } from "./compiler"
import path from "path"
import webpack from "webpack"
import MemoryFileSystem from "memory-fs"

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
function buildDir(dir, dirName, stats, config) {
  for(let file in dir) { //TODO: make this handle nesting
    if(path.extname(file) === ".html" && dir[file] instanceof Buffer) {
      const filepath = path.join(config.outRoot, config.outputDir, dirName, file).replace(/\\/, "/").replace(".jsx", ".html")
      config.outputFs.mkdirSync(path.dirname(filepath), { recursive: true })
      config.outputFs.writeFileSync(filepath, genHTML(config, dir[file].toString(), dataCache))
    } else {
      buildDir(dir[file], path.join(dirName, file), stats, config)
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
  return new Promise((rej, res) => {
    dataCompiler.run((err, stats) => {
      if(err) rej(err)
      else {
        buildCallback(err, stats, config, true)
        packer.run((err, stats) => {
          if(err) rej(err)
          else {
            buildCallback(err, stats, config, false)
            res()
          }
        })
      }
    })
  })
}

export default {
  build,
  watch
}