// extracts the assets required from the jsx (in `src` and `href`)
// the only thing this does to the source is change style preprocessor extensions to be `.css` 
// and adds imports for non dynamic content

import path from "path"
import { styleRegex, imgRegex } from "./config"
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')

export default function(source) {
  const callback = this.async()

  let assets = []
  // remove whitespace (outside quoutes)
  const compressedSrc = source.replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, "")

  assets = compressedSrc.match(/(src|href)\=(["\'])(?:(?=(\\?))\3.)*?\2/g)
  if(assets && assets.length > 0) {
    assets = assets.map((a: string) => 
      a.replace(/src=|href=/, "").trim().slice(1, - 1)
    )
  } else return callback(null, source)

  const promises = []
  const imports = []
  for(let asset of assets) {
    // images should be processed as standard dependencies
    // everything else should be processed as its own entry
    if(!asset.match(imgRegex)) {
      console.log("oof")
      this.addDependency(asset)
      promises.push(new Promise((res, rej) => {
        const dep = SingleEntryPlugin.createDependency(asset, assets)
        // style should be emited by the MiniCssExtractPlugin
        //TODO: figure out a way for webpack to process but not emit the raw js css
        const name = asset.match(styleRegex) ? path.posix.join("__asset", asset) : asset
        source = source.replace(asset, asset.replace(styleRegex, ".css"))
        this._compilation.addEntry(this.rootContext, dep, name, err => {
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