import * as fs from "fs"
import * as path from "path"

import recursive from "recursive-readdir"
import webpack from "webpack"
import MemFS from "memory-fs"
import ReactDOMServer from "react-dom/server"
import { error } from "./error"
import { getPath } from "./util"

interface BuildConfig {
  siteDir: string
}

const defaultConfig: BuildConfig = {
  siteDir: "/site"
}

function build(config: BuildConfig) {
  const mfs = new MemFS()
  return new Promise((res, rej) => {
    if(!config && !fs.existsSync(getPath("jsxs.config.json"))) config = defaultConfig
    
    recursive(getPath(config.siteDir), (err, files) => {
      if(err) rej(error(err))
      for(let i = 0; i < files.length; i++) {
        const packer = webpack({
          entry: files[i],
          output: {
            filename: "temp",
            path: "/"
          },
          resolve: {
            modules: [ getPath("components"), "node_modules" ],
          },
          module: {
            rules: [
              {
                test: /\.jsx$/,
                exclude: /(node_modules)/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env'],
                    plugins: ["@babel/plugin-transform-react-jsx"]
                  }
                }
              }
            ]
          },
          plugins: [
            new webpack.ProvidePlugin({
              'React': 'react'
            })
          ]
        })
        packer.outputFileSystem = mfs

        packer.run((err, stats) => {
          if(stats.hasErrors()) rej(error(stats.toJson().errors))
          console.log(packer.outputFileSystem)
          //@ts-ignore
          const compiled = eval(packer.outputFileSystem.data["temp"].toString())
          const outFile = files[i].split(config.siteDir.replace(/\/|\\/, ""))[1].replace(".jsx", ".html")
          fs.writeFile(getPath(path.join("out/", outFile)), ReactDOMServer.renderToString(compiled.default()), (err) => {
            console.log("hi")
          })
        })
        }
    })
  })
}

export {
  build
}