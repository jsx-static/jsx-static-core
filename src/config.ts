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
  let out = defaultConfig
  if(fs.existsSync("jsxs.config.json")) out = { 
    ...out,
    ...JSON.parse(fs.readFileSync("jsxs.config.json", "utf8")), 
  }
  if(config) out = { ...out, ...config } 
  if(out.inputFs !== fs && !config.inRoot) out.inRoot = "/"
  if(out.outputFs !== fs && !config.outRoot) out.outRoot = "/"

  return out
}

export function getPacker(config: JsxsConfig, outputFs: any): webpack.Compiler {
  // windows fix
  const iPath = config.inputFs === fs ? path : path.posix
  let compiler = webpack({
    mode: "development",
    name: "site compiler",
    context: config.inRoot,
    entry: () => new Promise((res, rej) => {
      recursive(iPath.join(config.inRoot, config.siteDir), { fs: config.inputFs }, (err, files) => {
        if(err) rej(err)
        else {
          files = files.reduce((a, f) => {
            // path is used here to preserve default behavior of relative, f.replace is used because there isn't a function to convert to posix
            a[path.relative(iPath.join(config.inRoot, config.siteDir), f).replace(".jsx", ".html")] = f.replace(/\\/g, "/"); 
            return a 
          }, {})

          if(config.inputFs.existsSync(iPath.join(config.inRoot, config.dataDir, config.dataEntry))) {
            files["__jsxs_data__.js"] = iPath.join(config.inRoot, config.dataDir, config.dataEntry)
          }
          
          res(files)
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
        iPath.join(config.inRoot, config.dataDir),
        iPath.join(config.inRoot, config.componentDir),
        iPath.join(config.inRoot, "node_modules")
      ],
    },
    resolveLoader: {
      modules: [
        path.join(path.resolve("."), "node_modules"),
        iPath.join(config.inRoot, "node_modules")
      ]
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          include: [
            iPath.join(config.inRoot, config.siteDir),
            iPath.join(config.inRoot, config.componentDir),
          ],
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
                plugins: [ "@babel/plugin-transform-react-jsx" ]
              }
            }
          ]
        },
        {
          test: /\.js$/,
          include: [
            config.dataDir
          ],
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
              }
            }
          ]
        },
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({ 
        "React": 'react',
        "Safe": ['react-safe', 'default'],
        "Script": ['react-safe', 'default', 'script']
      })
    ]
  })
  
  compiler.inputFileSystem = config.inputFs
  compiler.outputFileSystem = outputFs

  return compiler
}