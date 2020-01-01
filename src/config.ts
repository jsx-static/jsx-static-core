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
  dataEntry?: string
  inRoot?: string
  outRoot?: string
  hooks?: { //TODO: flesh these out
    postProcess?: (source: string) => string
    postEmit?: () => void
  }
}

export const defaultConfig: JsxsConfig = {
  inputFs: fs,
  outputFs: fs,
  siteDir: "/site",
  outputDir: "/build",
  componentDir: "/components",
  dataDir: "/data",
  dataEntry: "index.js",
  inRoot: path.resolve("."),
  outRoot: path.resolve("."),
}

export function getJsxsConfig(config: JsxsConfig): JsxsConfig {
  if(config) {
    let out = { ...defaultConfig, ...config } 
    if(out.inputFs !== fs && !config.inRoot) out.inRoot = ""
    if(out.outputFs !== fs && !config.outRoot) out.outRoot = ""
    return out
  }
  else if(fs.existsSync("jsxs.config.json")) return { 
    ...JSON.parse(fs.readFileSync("jsxs.config.json", "utf8")), 
    ...defaultConfig 
  }
  else return defaultConfig
}

export function genWebpack(config: JsxsConfig): webpack.Compiler {
  const wpConfig: webpack.Configuration = {
    entry: () => new Promise((res, rej) => {
      recursive(path.join(config.inRoot, config.siteDir), { fs: config.inputFs }, (err, files) => {
        if(err) rej(err)
        else {
          res(files.reduce((a, f) => { a[path.relative(path.join(config.inRoot, config.siteDir), f).replace(/\\/, "/")] = f; return a }, {}))
        }
      })
    }),
    output: {
      filename: "[name]",
      path: "/"
    },
    resolve: {
      modules: [
        path.join(path.resolve("."), "node_modules"),
        path.join(config.inRoot, config.componentDir),
        path.join(config.inRoot, "node_modules")
      ]
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