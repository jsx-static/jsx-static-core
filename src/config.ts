import webpack from "webpack"
import recursive from "recursive-readdir-ext"
import path from "path"

export function getConfig(mem: boolean): webpack.Configuration {
  return {
    entry: () => 
    new Promise((res, rej) => {
      recursive(path.join(mem ? "" : path.resolve("."), "site"), {}, (err, files) => {
          if(err) rej(err)
          else {
            console.log(files)
            res(files)
          }
        }
      )
    }),
    module: {
      rules: [
        {
          test: /\.jsx$/,
          //enforce: "post",

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
        }
      ]
    }
  }
}