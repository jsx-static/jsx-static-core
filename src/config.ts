import webpack from "webpack"
import recursive from "recursive-readdir-ext"
import path from "path"

export function getConfig(memIn: boolean, memOut: boolean): webpack.Configuration {
  return {
    entry: () => 
    new Promise((res, rej) => {
      recursive(path.join(memIn ? "" : path.resolve("."), "site"), {}, (err, files) => {
          if(err) rej(err)
          else {
            res(files.reduce((a, f) => { a[path.basename(f)] = f; return a }, {}))
          }
        }
      )
    }),
    output: {
      filename: "[name]",
      path: memOut ? "/" : path.join(path.resolve("."), "/build")
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
}