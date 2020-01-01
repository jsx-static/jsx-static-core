import jsxs from "../src/index"
import fs from "fs"
import MemoryFileSystem from "memory-fs"
import { fs as mfs, vol } from 'memfs'
import { ufs } from "unionfs"
import path from "path"

//TODO: test data injection, class components

const fileData = {
  "/site/Simple Functional Page.jsx": "export default () => <h1>hi</h1>",
}

vol.fromJSON(fileData)

const outputFs = new MemoryFileSystem(); // the cursed and unavoidable semicolon :(

beforeAll(done => {
  jsxs.build({
    inputFs: ufs.use(mfs).use(fs), // mfs for the site, fs for node_modules
    outputFs,
    hooks: {
      postEmit: () => done()
    }
  })
})

for(let file in fileData) {
  if(file.indexOf("/site/") === 0) {
    it(`${file} compiles successfully`, done => {
      expect(outputFs.data[path.join("build", path.basename(file)).replace(".jsx", ".html")].toString())
        .toBe("<!DOCTYPE html><h1>hi</h1>")
      done()
    })
  }
}