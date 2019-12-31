import webpack from "webpack"
import { getConfig } from "./config"
import MemoryFileSystem from "memory-fs"
import { genHTML } from "./compiler"
import express from "express"
import sockjsNode from "sockjs"
import http from "http"
import path from "path"

const sockInjection = `
<script src="sockjs.min.js"></script>
<script>
var sockjs_url = '/echo'
var sockjs = new SockJS(sockjs_url)

sockjs.onopen = function() { console.log('openning socket', sockjs.protocol) }
sockjs.onmessage = function(e) {
  console.log(e)
  if(JSON.parse(e.data).msg === "reload") location.reload()
}
sockjs.onclose = function() { console.log('closing socket') }
</script>
`

export function dev() {
  const packer = webpack(getConfig(false, true))
  const webpackOutputFs = new MemoryFileSystem()
  
  packer.outputFileSystem = webpackOutputFs
  
  
  packer.watch({}, (err, stats) => {
    for(let file in webpackOutputFs.data) {
      serverFs.writeFile("/" + file.replace(".jsx", ".html"), genHTML(webpackOutputFs.data[file].toString()) + sockInjection, console.log)
    }

    connections.forEach(conn => conn.emit("data", { msg: "reload" }))
  })
  

  // dev server stuff

  const serverFs = new MemoryFileSystem()
  
  const echo = sockjsNode.createServer({ 
    prefix: "/echo",
  })

  const server = express()
  server.use(express.static(path.join(path.dirname(require.resolve("sockjs-client")), "..", "dist")))
  
  server.get("/*", (req, res) => {
    res.setHeader("Content-Type", "text/html")
    res.send(serverFs.readFileSync(req.path))
  })

  
  const httpServer = http.createServer(server)
  
  let connections = []

  echo.on('connection', conn => {
    connections.push(conn)
    conn.on('data', msg => {
      conn.write(JSON.stringify(msg))
    })
  })

  echo.installHandlers(httpServer, {
    prefix: "/echo"
  })

  httpServer.listen(8000, () => {})
}

export default {
  dev
}