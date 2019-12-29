import * as nfs from "fs"
import * as path from "path"

import webpack from "webpack"
import WebpackDevServer from "webpack-dev-server"
import MemFS from "memory-fs"

import { getRoot, setRoot, setPostProcess, postProcess } from "./util/file"
import { genPackerConfig, getConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { genHTML } from "./compiler"
import { genData } from "./dataLoader"
import { watchSass, buildSass } from "./sass"
import { fs } from "memfs"

function build(params: any, memfs?: boolean) {
  if (memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()

  const config = getConfig(params)
  const packer = webpack(genPackerConfig(config))

  packer.inputFileSystem = config.fs
  packer.outputFileSystem = mfs

  if (!testWorkspace(config)) {
    console.error("needed folders do not exist, making them")
    prepareWorkspace(config)
  }

  // buildSass(config)

  const data = genData(config)
  return new Promise((res, rej) => {
    packer.run((err, stats) => {
      if (err) rej(err)
      if (stats.hasErrors()) rej(stats.compilation.errors)
      Promise.all([data]).then(([data]) => {
        //@ts-ignore // outputFileSystem.data is not a thing except it is because mfs
        for (let name in packer.outputFileSystem.data) {
          if (stats.hasErrors()) console.error(stats.compilation.errors)
          // @ts-ignore // outputFileSystem.data is not a thing except it is because mfs
          const compiled = eval(packer.outputFileSystem.data[name].toString())
          const outFile = path.basename(name).replace(".jsx", ".html")
          const compiledPages = genHTML(compiled, data, outFile)
          for (let i = 0; i < compiledPages.length; i++) {
            config.fs.writeFileSync(path.join(getRoot(), config.outputDir, compiledPages[i].filename), compiledPages[i].html)
          }
        }
        res()
      })
    })
  })
}

function dev(params: any, memfs?: boolean) {
  if (memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()

  const packerConfig = getConfig({ dev: true, ...params })
  const packer = webpack(genPackerConfig(packerConfig))
  
  packer.inputFileSystem = packerConfig.fs
  packer.outputFileSystem = mfs
  
  if (!testWorkspace(packerConfig)) {
    console.error("needed folders do not exist, making them")
    prepareWorkspace(packerConfig)
  }
  
  watchSass(packerConfig)
  
  const data = genData(packerConfig)
  
  const server = new WebpackDevServer(packer, {
    open: true,
    inline: true,
    publicPath: '/',
    contentBase: path.join(getRoot(), packerConfig.outputDir),
    stats: {
      colors: true,
    },
  })

  server.listen(8080, '127.0.0.1', () => {
    console.log('Starting server on http://localhost:8080')
  })
}

function watch(params: any, memfs?: boolean) {
  if (memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()

  const config = getConfig({ dev: true, ...params })
  const packer = webpack(genPackerConfig(config))

  packer.inputFileSystem = config.fs
  packer.outputFileSystem = mfs

  if (!testWorkspace(config)) {
    console.error("needed folders do not exist, making them")
    prepareWorkspace(config)
  }

  watchSass(config)

  const data = genData(config)
  return packer.watch({}, (err, stats) => {
    const data = genData(config)

    Promise.all([data]).then(([data]) => {
      console.log("compiled")
      if (stats.hasErrors()) console.error(stats.compilation.errors)
      // @ts-ignore // outputFileSystem.data is not a thing except it is because mfs
      for (let name in packer.outputFileSystem.data) {
        // @ts-ignore // outputFileSystem.data is not a thing except it is because mf
        const compiled = eval(packer.outputFileSystem.data[name].toString())
        const outFile = path.basename(name).replace(".jsx", ".html")
        const compiledPages = genHTML(compiled, data, outFile)
        for (let i = 0; i < compiledPages.length; i++) {
          config.fs.writeFileSync(path.join(getRoot(), config.outputDir, compiledPages[i].filename), compiledPages[i].html)
        }
      }
    })
  })
}

export {
  build,
  watch,
  dev
}