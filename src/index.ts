import webpack from "webpack"
import { getConfig } from "./config"
import MemoryFileSystem from "memory-fs"
import { genHTML } from "./compiler"
import express from "express"

export function dev() {
  const packer = webpack(getConfig(false, true))
  const webpackOutputFs = new MemoryFileSystem()
  
  packer.outputFileSystem = webpackOutputFs

  const serverFs = new MemoryFileSystem()

  packer.watch({}, (err, stats) => {
    for(let file in webpackOutputFs.data) {
      console.log(file)
      serverFs.writeFile("/" + file, genHTML(webpackOutputFs.data[file].toString()), console.log)
    }
  })

  const server = express()
  server.get("/*", (req, res) => {
    console.log("oof")
    console.log(req.path)
    console.log(serverFs.data)
    res.setHeader("Content-Type", "text/html")
    res.send(serverFs.readFileSync(req.path))
  })

  server.listen(8000, () => {})
}

export default {
  dev
}