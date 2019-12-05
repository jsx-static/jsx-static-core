import * as fs from "fs"
import * as path from "path"

import webpack from "webpack"

import { getPath } from "./util/file"

//@ts-ignore // recursive-readdir-ext doesn't have a type declaration in @types
import recursive from "recursive-readdir-ext"

interface BuildConfig {
  siteDir: string,
  componentDir: string,
  outputDir: string,
  dataDir: string,
  dataEntry: string,
  fs: any,
  webpackConfig?: webpack.Configuration
}

const defaultBuildConfig: BuildConfig = {
  siteDir: "/site",
  componentDir: "/components",
  outputDir: "/build",
  dataDir: "/data",
  fs,
  dataEntry: "index.js"
}

function genWebpackConfig(buildConfig: BuildConfig): webpack.Configuration {
  return {
    mode: "development",
    entry: () =>
      new Promise((res, rej) => {
        recursive(path.join(path.resolve("."), buildConfig.siteDir), (err, files) => {
          if (err) rej(err)
          else res(files.reduce((a, c) => { a[path.basename(c).replace(".jsx", ".html")] = c; return a }, {}))
        })
      }),
    output: {
      filename: "[id]",
      path: "/",
    },
    resolve: {
      modules: [
        "node_modules",
        path.join(path.resolve("."), buildConfig.componentDir),
        path.join(path.resolve("."), "node_modules")
      ],
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          exclude: /(node_modules)/,
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
            },
          ]
        },
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        'React': 'react'
      })
    ]
  }

  return {
    mode: "development",
    entry: () =>
      new Promise((res, rej) => {
        recursive(path.join(path.resolve("."), buildConfig.siteDir), {
          fs: buildConfig.fs
        }, (err, files) => {
          if (err) rej(err)
          else res(files.reduce((a, c) => { a[path.basename(c).replace(".jsx", ".html")] = c; return a }, {}))
        })
      }),
    // devtool: "eval",
    // output is in memory thus no actual file is written
    output: {
      filename: "[id]",
      path: "/",
    },
    // components included in order to allow for simple including of the components dir
    resolve: {
      modules: [
        "node_modules",
        getPath(path.join(path.resolve("."), buildConfig.siteDir)),
        path.join(path.resolve("."), "node_modules")
      ],
    },
    performance: {
      hints: "warning"
    },
    module: {
      rules: [
        // transform jsx files
        {
          test: /\.jsx$/,
          exclude: /(node_modules)/,
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
            },
          ]
        }
      ]
    },
    // lets the user not have to include react every file
    plugins: [
      new webpack.ProvidePlugin({
        'React': 'react'
      })
    ]
  }
}

function getConfig(pConfig: any): BuildConfig {
  if (pConfig) return { ...defaultBuildConfig, ...pConfig }
  else if (!fs.existsSync(getPath("jsxs.config.json"))) return defaultBuildConfig
  else return JSON.parse(fs.readFileSync(getPath("jsxs.config.json"), "utf8"))
}

export {
  BuildConfig,
  defaultBuildConfig,
  genWebpackConfig,
  getConfig,
}