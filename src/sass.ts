import sass from "node-sass"
import chokidar from "chokidar"
import fs from "fs"
import path from "path"
import { BuildConfig } from "./config"
import recursive from "recursive-readdir-ext"
import { getRoot } from "./util/file"

function compileSass(files: string[], config: BuildConfig) {
  files.forEach(f => {
    sass.render({
      file: f,
      outFile: path.join(getRoot(), "build/assets/style/", path.relative(path.join(getRoot(), config.styleDir), f))
    }, (err, res) => {
      if (!err) {
        fs.mkdirSync("./build/assets/style", { recursive: true })
        fs.writeFile("./build/assets/style/style.css", res.css, () => { })
      } else console.error(err)
    })
  })
}

function watchSass(config: BuildConfig) {
  const watcher = chokidar.watch(path.join(getRoot(), config.styleDir), { ignored: /^[_].*[^(\.sass|\.scss)]/ })
  watcher.on("all", path => {
    console.log("oof")
    compileSass([path], config)
  })
}

function buildSass(config: BuildConfig) {
  recursive(path.join(getRoot(), config.styleDir), { fs: config.fs }, (err, files) => {
    if(err) console.error(err)
    else {
      compileSass(files.filter(f => path.basename(f).indexOf("_") !== 0), config)
    }
  })
}

export {
  watchSass,
  buildSass
}