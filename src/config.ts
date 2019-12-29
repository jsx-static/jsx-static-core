import * as fs from "fs"
import * as path from "path"

import webpack from "webpack"

import { getRoot, getPath } from "./util/file"

//@ts-ignore // recursive-readdir-ext doesn't have a type declaration in @types
import recursive from "recursive-readdir-ext"

interface BuildConfig {
  siteDir: string,
  componentDir: string,
  outputDir: string,
  dataDir: string,
  styleDir: string,
  assetsDir: string,
  dataEntry: string,
  fs: any,
  webpackConfig?: webpack.Configuration,
  dev: boolean
}

const defaultBuildConfig: BuildConfig = {
  siteDir: "/site",
  componentDir: "/components",
  outputDir: "/build",
  dataDir: "/data",
  styleDir: "/style",
  assetsDir: "/assets",
  fs,
  dataEntry: "index.js",
  dev: false
}

function genPackerConfig(buildConfig: BuildConfig): webpack.Configuration {
  return {
    mode: "development",
    devtool: false,
    entry: () =>
      new Promise((res, rej) => {
        recursive(path.join(getRoot(), buildConfig.siteDir), { fs: buildConfig.fs }, (err, files) => {
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
        path.join(path.resolve("."), "node_modules"),
        path.join(getRoot(), buildConfig.componentDir),
        path.join(getRoot(), "node_modules")
      ],
      extensions: [".js"],
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          exclude: /(node_modules)/,
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
            },
          ]
        },
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        'React': 'react'
      }),
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
  genPackerConfig,
  getConfig,
}