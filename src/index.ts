import * as fs from "fs"
import * as path from "path"

import recursive from "recursive-readdir"
import webpack from "webpack"
import MemFS from "memory-fs"

import { error } from "./error"
import { getPath } from "./util"

interface BuildConfig {
  siteDir: string
}

const defaultConfig: BuildConfig = {
  siteDir: "./site"
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
            filename: path.basename(files[i]),
            path: "/out"
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
        })
        packer.outputFileSystem = mfs

        console.log(files[i])
        packer.run((err, stats) => {
          //@ts-ignore
          fs.writeFile(path.basename(files[i]), packer.outputFileSystem.data.out[path.basename(files[i])], (err) => {
            console.log("hi")
          })
          if(stats.hasErrors()) rej(error(stats.toJson().errors))
        })
        }
    })
  })
}

export {
  build
}