import webpack from "webpack"
import WebpackDevServer from "webpack-dev-server"
import { getConfig } from "./config"
import { fs as mfs } from 'memfs'
import path from "path"


export function dev() {
  const packer = webpack(getConfig(false))

  const server = new WebpackDevServer(packer, {
    stats: {
      colors: true
    }
  })

  server.listen(8000, (err) => {
    console.error(err)
  })
  //@ts-ignore
}

export default {
  dev
}