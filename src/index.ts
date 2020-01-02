import { genWebpack, JsxsConfig, getJsxsConfig } from "./config"
import { genHTML } from "./compiler"
import path from "path"
import webpack from "webpack"
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

function buildDir(dir, dirName, stats, config) {
  for(let file in dir) { //TODO: make this handle nesting
    if(dir[file] instanceof Buffer) {
      const filepath = path.join(config.outRoot, config.outputDir, dirName, file).replace(/\\/, "/").replace(".jsx", ".html")
      config.outputFs.mkdirSync(path.dirname(filepath), { recursive: true })
      config.outputFs.writeFileSync(filepath, genHTML(config, dir[file].toString()))
    } else {
      buildDir(dir[file], path.join(dirName, file), stats, config)
    }
  }
}

const buildCallback = (err: any, stats: webpack.Stats, config: JsxsConfig) => {
  if(err) console.error(err)
  else if(stats.hasErrors()) console.error(stats.toString())
  else {
    //@ts-ignore // data isn't normally a part of a fs but in this case it is because it will always be memfs
    buildDir(stats.compilation.compiler.outputFileSystem.data, "", stats, config)
    if(config.hooks && config.hooks.postEmit) config.hooks.postEmit()
  }
}

export function watch(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  const packer = genWebpack(config)
  prepareWorkspace(config)
  return packer.watch({}, (err, stats) => buildCallback(err, stats, config))
}

export function build(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  const packer = genWebpack(config)
  prepareWorkspace(config)
  return new Promise((rej, res) => {
    packer.run((err, stats) => {
      if(err) rej(err)
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