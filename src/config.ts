import webpack from "webpack"

import { getPath } from "./util"


interface BuildConfig {
  siteDir: string,
  componentDir: string,
  outputDir: string
}

const defaultBuildConfig: BuildConfig = {
  siteDir: "/site",
  componentDir: "/components",
  outputDir: "/build"
}

function genWebpackConfig(buildConfig: BuildConfig, entry: string): webpack.Configuration {
  return {
    entry,
    // output is in memory thus no actual file is written
    output: {
      filename: "temp",
      path: "/",
    },
    // components included in order to allow for simple including of the components dir
    resolve: {
      modules: [ getPath(buildConfig.componentDir), "node_modules" ],
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
    // lets the user not have to import react every file
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