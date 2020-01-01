import { genWebpack, JsxsConfig, getJsxsConfig } from "./config"
import { genHTML } from "./compiler"
import path from "path"
import webpack from "webpack"

function prepareWorkspace(config: JsxsConfig) {
  function create(dir: string) {
    if(!config.inputFs.existsSync(path.join(config.inRoot, dir))) {
      console.log(`${dir} not found, creating ${dir}`)
      config.inputFs.mkdir(path.join(config.inRoot, dir), err => { if(err) console.error(`failed to create ${dir}`) })
    }
  }

  create(config.outputDir)
  create(config.componentDir)
  create(config.dataDir)
  create(config.siteDir)
}

const buildCallback = (err: any, stats: webpack.Stats, config: JsxsConfig) => {
  if(err) console.error(err)
  else if(stats.hasErrors()) console.error(stats.toString())
  else {
    //@ts-ignore // data isn't normally a part of a fs but in this case it is because it will always be memfs
    for(let file in stats.compilation.compiler.outputFileSystem.data) { //TODO: make this handle nesting
      config.outputFs.writeFile(
        path.join(config.outRoot, config.outputDir, "/" + file).replace(/\\/, "/").replace(".jsx", ".html"),
        //@ts-ignore // ^
        genHTML(config, stats.compilation.compiler.outputFileSystem.data[file].toString()), 
        err => { if(err) console.error(err) })
    }
    if(config.hooks && config.hooks.postEmit) config.hooks.postEmit()
  }
}

export function watch(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  const packer = genWebpack(config)
  prepareWorkspace(config)
  
  packer.watch({}, (err, stats) => buildCallback(err, stats, config))
}

export function build(config?: JsxsConfig) {
  config = getJsxsConfig(config)
  const packer = genWebpack(config)
  prepareWorkspace(config)

  packer.run((err, stats) => buildCallback(err, stats, config))
}

export default {
  build,
  watch
}