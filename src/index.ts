import * as nfs from "fs"
import * as path from "path"

import webpack from "webpack"
import MemFS from "memory-fs"

import { getRoot, setRoot, setPostProcess, postProcess } from "./util/file"
import { genWebpackConfig, getConfig } from "./config"
import { testWorkspace, prepareWorkspace } from "./workspace"
import { genHTML } from "./compiler"
import { genData } from "./dataLoader"
import { watchSass, buildSass } from "./sass"
import express from "express"

function build(params: any, memfs?: boolean) {
  if (memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()

  const config = getConfig(params)
  const packer = webpack(genWebpackConfig(config))

  packer.inputFileSystem = config.fs
  packer.outputFileSystem = mfs

  if (!testWorkspace(config)) {
    console.error("needed folders do not exist, making them")
    prepareWorkspace(config)
  }

  buildSass(config)

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

function watch(params: any, memfs?: boolean) {
  if (memfs) {
    setRoot("")
    setPostProcess((str: any) => str.replace(/\\/g, "/"))
  } else setRoot(path.resolve("."))

  const mfs = new MemFS()

  const config = getConfig(params)
  const packer = webpack(genWebpackConfig(config))

  packer.inputFileSystem = config.fs
  packer.outputFileSystem = mfs

  if (!testWorkspace(config)) {
    console.error("needed folders do not exist, making them")
    prepareWorkspace(config)
  }

  watchSass(config)
  const app = express()

  app.get("/*", (req, res) => {
    let indexFile = path.basename(req.url)
    indexFile = indexFile ? indexFile : "index"
    indexFile +=  ".html"
    if(nfs.existsSync(path.join(getRoot(), config.outputDir, path.dirname(req.url), indexFile))) res.send(nfs.readFileSync(path.join(getRoot(), config.outputDir, path.dirname(req.url), indexFile), "utf8"))
    else res.send("404")
    console.log(path.join(getRoot(), config.outputDir, path.dirname(req.url), indexFile)) 
  })

  const port = 8000
  app.listen(port, () => console.log(`listening on port ${port}`))

  return packer.watch({}, (err, stats) => {
    const data = genData(config)

    Promise.all([data]).then(([data]) => {
      // @ts-ignore // outputFileSystem.data is not a thing except it is because mfs
      for (let name in packer.outputFileSystem.data) {
        if (stats.hasErrors()) console.error(stats.compilation.errors)
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
  watch
}