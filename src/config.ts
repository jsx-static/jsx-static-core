import * as fs from "fs"
import * as path from "path"

import webpack from "webpack"

import { getPath } from "./util/file"


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

function genWebpackConfig(buildConfig: BuildConfig, entry?: string|string[]): webpack.Configuration {
  return {
    mode: "development",
    entry,
    devtool: "eval",
    // output is in memory thus no actual file is written
    output: {
      filename: "temp[name]",
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
    // lets the user not have to include react every file
    plugins: [
      new webpack.ProvidePlugin({
        'React': 'react'
      })
    ]
  }
}

export {
  BuildConfig,
  defaultBuildConfig,
  genWebpackConfig
}