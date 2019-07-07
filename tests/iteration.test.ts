import * as nfs from "fs"

import { fs as mfs, vol } from "memfs"
//@ts-ignore // unionfs doesn't have type declaration
import { ufs } from 'unionfs'

import { build } from "../src/index"

vol.fromJSON({
  "/build/.keep": "",
  "/data/index.js": `
    module.exports = {
      many: [ "one", "two", "three" ]
    }
  `,
  "/site/iterator.jsx": `
    export default class extends React.Component {
      constructor(props) {
        super(props)
      }

      iterator() { 
        return this.props.many.map(n => ({
          filename: n + ".html",
          data: n
        }))
      }
      render(instance) {
        return <h1>{ instance }</h1>
      }
    }
  `
})

it("compiles a file into many files", async () => {
  expect.assertions(3)
  jest.setTimeout(60000) // the processing time for the build function is pretty long

  await build({
    fs: ufs.use(mfs).use(nfs) // use pages stored in memory with files stored in node_modules
  }, true).then(() => {
    expect(mfs.readFileSync("/build/one.html", "utf8")).toBe("<!DOCTYPE html><h1>one</h1>")
    expect(mfs.readFileSync("/build/two.html", "utf8")).toBe("<!DOCTYPE html><h1>two</h1>")
    expect(mfs.readFileSync("/build/three.html", "utf8")).toBe("<!DOCTYPE html><h1>three</h1>")
  }).catch(console.error)
})