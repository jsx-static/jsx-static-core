import jsxs from "../src/index"
import fs from "fs"
import MemoryFileSystem from "memory-fs"
import { fs as mfs, vol } from 'memfs'
import { ufs } from "unionfs"
import path from "path"

vol.fromJSON({
  "/site/Simple Functional Page.jsx": "export default () => <h1>hi</h1>",
})

const outputFs = new MemoryFileSystem()

it("Simple Functional Page.jsx" + " compiles successfully", async done => {
  await jsxs.build({
    inputFs: ufs.use(mfs).use(fs),
    outputFs,
    hooks: {
      postEmit: () => {
        expect(outputFs.data[path.join("build", "Simple Functional Page.jsx").replace(".jsx", ".html")].toString()).toBe("<!DOCTYPE html><h1>hi</h1>")
        done()
      }
    }
  }).then(() => {
    console.warn("done")
  })
})