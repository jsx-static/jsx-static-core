import { getPacker, JsxsConfig, getJsxsConfig } from "./config"
import { compilePage } from "./compiler"
import path from "path"
import webpack from "webpack"
import MemoryFileSystem from "memory-fs"
import { fs } from "memfs"

async function prepareWorkspace(config: JsxsConfig) {
  const promises = []
  function create(dir: string, fs: any, root: string) {
    console.log(path.posix.join(root, dir))
    if(!fs.existsSync(path.posix.join(root, dir))) {
      console.log(`${dir} not found, creating ${dir}`)
      promises.push(new Promise((res, rej) => {
        fs.mkdir(path.posix.join(root, dir), err => { 
          if(err) {
            rej(err + `\nfailed to create ${dir}`)
          } else {
            res()
          }
        })
      }))
    }
  }

  create(config.assetDir, config.inputFs, config.inRoot)
  create(config.componentDir, config.inputFs, config.inRoot)
  create(config.dataDir, config.inputFs, config.inRoot)
  create(config.siteDir, config.inputFs, config.inRoot)
  create(config.outputDir, config.outputFs, config.outRoot)

  await Promise.all(promises).then(() => {
    console.log("asset dir exists: ", config.inputFs.existsSync(path.posix.join(config.inRoot, config.assetDir)))
  })
}

let dataCache = {
  evaluated: {},
  src: null
}

function recursiveMfsReader(dir: any, dirname: string, callback: (file: string, data: Buffer) => void) {
  for(let file in dir) {
    if(dir[file] instanceof Buffer) {
      callback(path.posix.join(dirname, file), dir[file])
    } else {
      recursiveMfsReader(dir[file], path.posix.join(dirname, file), callback)
    }
  }
}

function buildDir(dir: any, dirName: string, stats: webpack.Stats, config: JsxsConfig) {
  recursiveMfsReader(dir, dirName, (file, data) => {
    if(path.extname(file) === ".html") {
      const outputDir = path.posix.dirname(path.posix.join(config.outRoot, config.outputDir, dirName, file).replace(/\\/, "/").replace(".jsx", ".html"))
      
      if(!config.outputFs.existsSync(outputDir)) config.outputFs.mkdirSync(outputDir, { recursive: true })
      const outputPages = compilePage(config, file, data.toString(), dataCache.evaluated)
      outputPages.forEach(page => {
        if(!config.outputFs.existsSync(path.posix.join(outputDir, path.dirname(page.filename)))) config.outputFs.mkdirSync(path.posix.join(outputDir, path.dirname(page.filename)), { recursive: true })
        config.outputFs.writeFileSync(path.posix.join(outputDir, page.filename), (config.hooks && config.hooks.postProcess) ? config.hooks.postProcess(page.html) : page.html)
      })
    }
  })
}

const buildCallback = async (err: any, stats: webpack.Stats, config: JsxsConfig) => {
  if(err) console.error(err)
  else if(stats.hasErrors()) console.error(stats.toString())
  else {
    //@ts-ignore // data isn't normally a part of a fs but in this case it is because it will always be memfs
    let outputFsData = stats.compilation.compiler.outputFileSystem.data
    if(outputFsData["__jsxs_data__.js"] && dataCache.src !== outputFsData["__jsxs_data__.js"].toString()) {
      dataCache.src = outputFsData["__jsxs_data__.js"].toString()
      try {
        dataCache.evaluated = eval(dataCache.src).default
        if(config.hooks && config.hooks.postDataEmit) config.hooks.postDataEmit()
      } catch(err) {
        console.error(`data failed to compile`)
      }
    }
    buildDir(outputFsData, "", stats, config)

    if(outputFsData['assets']) {
      const promises = [] 
      recursiveMfsReader(outputFsData['assets'], "", (file, data) => {
        console.log(file)
        promises.push(new Promise((res, rej) => {
          const outputDir = path.posix.join(config.outRoot, config.outputDir, "assets", path.dirname(file))
          if(!config.outputFs.existsSync(outputDir)) config.outputFs.mkdirSync(outputDir, { recursive: true })
          config.outputFs.writeFile(path.posix.join(outputDir, path.basename(file)), data, (err) => {
            if(err) rej(err)
            res()
          })
        }))
      })
  
      await Promise.all(promises)
    }

    if(config.hooks && config.hooks.postSiteEmit) config.hooks.postSiteEmit()

    //@ts-ignore // ^
    stats.compilation.compiler.outputFileSystem.data = {}
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