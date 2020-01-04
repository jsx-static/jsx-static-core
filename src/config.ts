import webpack from "webpack"
import recursive from "recursive-readdir-ext"
import path from "path"
import fs from "fs"

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
    postSiteEmit?: () => void
    postDataEmit?: () => void
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
    if(out.inputFs !== fs && !config.inRoot) out.inRoot = "/"
    if(out.outputFs !== fs && !config.outRoot) out.outRoot = "/"
    return out
  }
  else if(fs.existsSync("jsxs.config.json")) return { 
    ...JSON.parse(fs.readFileSync("jsxs.config.json", "utf8")), 
    ...defaultConfig 
  }
  else return defaultConfig
}

function getSiteCompiler(config: JsxsConfig): webpack.Configuration {
  return {
    mode: "development",
    name: "site compiler",
    context: config.inRoot,
    entry: () => new Promise((res, rej) => {
      recursive(path.join(config.inRoot, config.siteDir), { fs: config.inputFs }, (err, files) => {
        if(err) rej(err)
        else {
          res(files.reduce((a, f) => { 
            a[path.relative(path.join(config.inRoot, config.siteDir), f).replace(/\\/, "/").replace(".jsx", ".html")] = f.replace(/\\/, "/"); 
            return a 
          }, {}))
        }
      })
    }),
    output: {
      filename: "[name]",
      path: "/"
    },
    resolve: {
      modules: [
        path.posix.join(path.resolve("."), "node_modules"),
        path.posix.join(config.inRoot, config.componentDir),
        path.posix.join(config.inRoot, "node_modules")
      ],
    },
    resolveLoader: {
      modules: [
        path.posix.join(path.resolve("."), "node_modules"),
        path.posix.join(config.inRoot, "node_modules")
      ]
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          use: [
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
        },
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({ "React": 'react' })
    ]
  }
}

function getDataCompiler(config: JsxsConfig): webpack.Configuration {
  return {
    mode: "development",
    name: "site compiler",
    context: config.inRoot,
    entry: path.posix.join(config.dataDir, config.dataEntry),
    output: {
      filename: "__jsxs_data__.js",
      path: "/"
    },
    resolve: {
      modules: [
        path.posix.join(path.resolve("."), "node_modules"),
        path.posix.join(config.inRoot, config.dataDir),
        path.posix.join(config.inRoot, "node_modules")
      ],
    },
    resolveLoader: {
      modules: [
        path.posix.join(path.resolve("."), "node_modules"),
        path.posix.join(config.inRoot, "node_modules")
      ]
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
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
        },
      ]
    }
  }
}

export function genDataWebpack(config: JsxsConfig, outputFs: any): webpack.Compiler {
  let compiler = webpack(getDataCompiler(config))
  
  compiler.inputFileSystem = config.inputFs
  compiler.outputFileSystem = outputFs

  return compiler
}

export function genSiteWebpack(config: JsxsConfig, outputFs: any): webpack.Compiler {
  let compiler = webpack(getSiteCompiler(config))
  
  compiler.inputFileSystem = config.inputFs
  compiler.outputFileSystem = outputFs

  return compiler
}