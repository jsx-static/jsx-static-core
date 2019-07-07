import * as nfs from "fs"

import { fs as mfs, vol } from "memfs"
//@ts-ignore // unionfs doesn't have type declaration
import { ufs } from 'unionfs'

import { build } from "../src/index"

vol.fromJSON({
  "/build/.keep": "",
  "/site/customName.jsx": `
    export default class extends React.Component {
      constructor(props) {
        super(props)
      }

      config() {
        return { filename: "otherName.html" }
      }

      render() {
        return <h1>other file</h1>
      }
    }
  `
})

it("compiles a file to have a different name", async () => {
  expect.assertions(1)
  jest.setTimeout(60000) // the processing time for the build function is pretty long

  await build({
    fs: ufs.use(mfs).use(nfs) // use pages stored in memory with files stored in node_modules
  }, true).then(() => {
    expect(mfs.readFileSync("/build/otherName.html", "utf8")).toBe("<!DOCTYPE html><h1>other file</h1>")
  }).catch(console.error)
})