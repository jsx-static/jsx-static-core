// extracts the assets required from the jsx (in `src` and `href`)
// the only thing this does to the source is change style preprocessor extensions to be `.css`

import { getOptions } from "loader-utils"
import path from "path"
import fs from "fs"
import { styleRegex, imgRegex } from "./config"
//@ts-ignore
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')

//TODO: make this sync if it works
export default function(source, a, b, c, d) {
  const callback = this.async()
  const options = getOptions(this)

  let assets = []
  // remove whitespace (outside quoutes)
  const compressedSrc = source.replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, "")

  assets = compressedSrc.match(/(src|href)\=(["\'])(?:(?=(\\?))\3.)*?\2/g)
  if(assets && assets.length > 0) {
    assets = assets.map((a: string) => 
      a.replace(/src=|href=/, "").trim().slice(1, - 1)
    )
  } else return callback(null, source)

  // i hate windows
  const iPath = options.config.inputFs === fs ? path : path.posix

  const promises = []
  const imports = []
  for(let asset of assets) {
    // images should be processed as standard dependencies
    // everything else should be processed as its own entry
    if(!asset.match(imgRegex)) {
      this.addDependency(asset)
      promises.push(new Promise((res, rej) => {
        const dep = SingleEntryPlugin.createDependency(asset, assets)
        // style should be emited by the MiniCssExtractPlugin
        //TODO: figure out a way for webpack to process but not emit the raw js css
        const name = asset.match(styleRegex) ? path.posix.join("__asset", asset) : asset
        source = source.replace(asset, asset.replace(styleRegex, ".css"))
        this._compilation.addEntry(this.context, dep, name, (err, module) => {
          if(err) rej(err)
          res()
        })
      }))
    } else {
      imports.push(`import "${ asset }"\n`)
    }
  }

  Promise.all(promises).then(() => {
    callback(null, imports.join("") + source)
  }).catch((err) => {
    callback(err)
    this.emitError(err)
  })
}