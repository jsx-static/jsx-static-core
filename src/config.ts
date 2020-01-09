import webpack from "webpack"
import recursive from "recursive-readdir-ext"
import path from "path"
import fs from "fs"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import postcssNormalize from "postcss-normalize"

export interface JsxsConfig {
  inputFs?: any
  outputFs?: any
  siteDir?: string
  outputDir?: string
  componentDir?: string
  dataDir?: string
  assetDir?: string
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
  assetDir: "/assets",
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

const styleRegex = /\.(css|scss|sass)?/

// modified from: https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js
function getStyleLoaders(cssOptions, preProcessor?: string): webpack.RuleSetUse {
  const loaders: webpack.RuleSetUse = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        esModule: true,
      }
    },
    {
      loader: 'css-loader',
      options: cssOptions,
    },
    {
      loader: 'postcss-loader',
      options: {
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
          // Adds PostCSS Normalize as the reset css with default options,
          // so that it honors browserslist config in package.json
          // which in turn let's users customize the target behavior as per their needs.
          postcssNormalize(),
        ],
      },
    },
  ]
  if (preProcessor) {
    loaders.push(
      'resolve-url-loader',
      preProcessor,
    )
  }

  return loaders
}

export function getPacker(config: JsxsConfig, outputFs: any): webpack.Compiler {
  // windows fix
  const iPath = config.inputFs === fs ? path : path.posix
  const oPath = config.outputFs === fs ? path : path.posix

  let compiler = webpack({
    mode: "production",
    name: "site compiler",
    context: config.inRoot,
    entry: () => new Promise((res, rej) => {
      recursive(iPath.join(config.inRoot, config.siteDir), { fs: config.inputFs }, (err, siteFiles) => {
        if(err) rej(err)
        else {
          siteFiles = siteFiles.reduce((a, f) => {
            // path is used here to preserve default behavior of relative, f.replace is used because there isn't a function to convert to posix
            a[path.relative(iPath.join(config.inRoot, config.siteDir), f).replace(".jsx", ".html").replace(/\\/g, "/")] = f.replace(/\\/g, "/"); 
            return a 
          }, {})

          const cb = (files) => {
            files = files.reduce((a, f) => {
              // path is used here to preserve default behavior of relative, *.replace is used because there isn't a function to convert to posix
              if(f.search(styleRegex) !== -1) {
                // style should be emited by the MiniCssExtractPlugin
                //TODO: figure out a way for webpack to process but not emit the raw js css
                a[path.join("__assets", path.relative(iPath.join(config.inRoot, config.assetDir), f)).replace(/\\/g, "/")] = f.replace(/\\/g, "/"); 
              } else {
                a[path.join("assets", path.relative(iPath.join(config.inRoot, config.assetDir), f)).replace(/\\/g, "/")] = f.replace(/\\/g, "/"); 
              }
              return a 
            }, {})
  
            if(config.inputFs.existsSync(iPath.join(config.inRoot, config.dataDir, config.dataEntry))) {
              files["__jsxs_data__.js"] = iPath.join(config.inRoot, config.dataDir, config.dataEntry)
            }

            files = { ...files, ...siteFiles }
            
            res(files)
          }

          try {
            if(config.inputFs.readdirSync(iPath.join(config.inRoot, config.assetDir))) {
              recursive(iPath.join(config.inRoot, config.assetDir), { fs: config.inputFs }, (err, files) => {
                if(err) console.log(err)
    
                if(err) rej(err)
                else {
                  cb(files.filter(f => {
                    return path.basename(f).indexOf("_") !== 0
                  }))
                }
              })
            } else cb([])
          } catch {
            cb([])
          }
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
        iPath.join(config.inRoot, config.assetDir),
        iPath.join(config.inRoot),
        iPath.join(config.inRoot, "node_modules")
      ],
    },
    resolveLoader: {
      modules: [
        path.join(path.resolve("."), "node_modules"),
        iPath.join(config.inRoot, "node_modules"),
        path.join(__dirname, "..", "..", "node_modules") // for testing
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

        {
          test: /\.js$/,
          include: [
            iPath.join(config.inRoot, config.assetDir),
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
        
        {
          test: /\.css$/,
          include: [
            iPath.join(config.inRoot, config.assetDir),
          ],
          use: getStyleLoaders({
            importLoaders: 1
          }),

          sideEffects: true,
        },

        {
          test: /\.(scss|sass)$/,
          include: [
            iPath.join(config.inRoot, config.assetDir),
          ],
          use: getStyleLoaders({
              importLoaders: 2,
          }, 'sass-loader'),
          
          sideEffects: true,
        },

        {
          loader: require.resolve('file-loader'),
          include: [
            iPath.join(config.inRoot, config.assetDir),
          ],
          exclude: [
            /\.(js|jsx|html)$/,
            styleRegex
          ],
          options: {
            name: "assets/[name].[ext]", 
          },
        }
      ]
    },

    plugins: [
      new MiniCssExtractPlugin({
        // @ts-ignore // for some reason MiniCssExtractPlugin has not updated this, 
        //TODO: check if deprecated
        moduleFilename: chunk => path.posix.relative(config.inRoot.replace(/\\/g, "/"), chunk.entryModule.rawRequest).replace(styleRegex, ".css"),
        esModule: true
      }),

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