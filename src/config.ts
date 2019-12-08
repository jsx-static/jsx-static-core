import * as fs from "fs"
import * as path from "path"

import webpack, { HotModuleReplacementPlugin } from "webpack"
import webpackDevServer from "webpack-dev-server"

import { getPath } from "./util/file"
webpackDevServer.addDevServerEntrypoints
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

function genWebpackConfig(buildConfig: BuildConfig, entry: string[]): webpack.Configuration {
  return {
    mode: "development",
    entry: entry,
    devtool: "eval",
    // output is in memory thus no actual file is written
    output: {
      filename: "temp[id]",
      path: "/",
    },
    optimization: {
      minimize: false
    },
    // components included in order to allow for simple including of the components dir
    resolve: {
      modules: [ 
        "node_modules", 
        getPath(buildConfig.componentDir), 
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
              loader: path.join(path.dirname(__filename), "./loader/index.js"),
              options: {
                buildConfig
              }
            },
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ["@babel/plugin-transform-react-jsx", "@babel/plugin-transform-modules-commonjs"]
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
      }),
      new HotModuleReplacementPlugin({})
    ]
  }
}

function getConfig(pConfig: any): BuildConfig {
  if(pConfig) return { ...defaultBuildConfig, ...pConfig }
  else if (!fs.existsSync(getPath("jsxs.config.json"))) return defaultBuildConfig
  else return JSON.parse(fs.readFileSync(getPath("jsxs.config.json"), "utf8"))
}

export {
  BuildConfig,
  defaultBuildConfig,
  genWebpackConfig,
  getConfig,
}