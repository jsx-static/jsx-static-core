import webpack from "webpack"
import recursive from "recursive-readdir-ext"
import path from "path"
import fs from "fs"
import MemoryFileSystem from "memory-fs"

export interface JsxsConfig {
  inputFs?: any
  outputFs?: any
  siteDir?: string
  outputDir?: string
  componentDir?: string
  dataDir?: string
  dataEntry?: string,
  root?: string
}

export const defaultConfig: JsxsConfig = {
  inputFs: fs,
  outputFs: fs,
  siteDir: "/site",
  outputDir: "/build",
  componentDir: "/components",
  dataDir: "/data",
  dataEntry: "index.js",
  root: path.resolve(".")
}

export function getJsxsConfig(config: JsxsConfig): JsxsConfig {
  if(config) {
    let out = { ...defaultConfig, ...config } 
    if(out.outputFs instanceof(MemoryFileSystem) && !config.root) out.root = ""
    return out
  }
  else if(fs.existsSync("jsxs.config.json")) return { 
    ...JSON.parse(fs.readFileSync("jsxs.config.json", "utf8")), 
    ...defaultConfig 
  }
  else return defaultConfig
}

export function genWebpack(config: JsxsConfig, memIn: boolean, memOut: boolean): webpack.Compiler {
  const wpConfig: webpack.Configuration = {
    entry: () => 
    new Promise((res, rej) => {
      recursive(path.join(memIn ? "" : path.resolve("."), "site"), {}, (err, files) => {
          if(err) rej(err)
          else {
            res(files.reduce((a, f) => { a[path.basename(f)] = f; return a }, {}))
          }
        }
      )
    }),
    output: {
      filename: "[name]",
      path: memOut ? "/" : path.join(path.resolve("."), "/build")
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          use: [
            {
              loader: path.resolve(__dirname, "loader.js"),
              options: {} 
            },
            {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', {
                  targets: {
                    esmodules: false,
                    node: "current"
                  },
                  modules: "cjs"
                }]],
                plugins: ["@babel/plugin-transform-react-jsx"]
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({ "React": 'react' })
    ]
  }

  let compiler = webpack(wpConfig)

  compiler.outputFileSystem = new MemoryFileSystem()
  compiler.inputFileSystem = config.inputFs

  return compiler
}