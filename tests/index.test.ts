import * as nfs from "fs"

import { build } from "../src/index"
import { getPath } from "../src/util/file"

import { fs as mfs } from "memfs"
//@ts-ignore // unionfs doesn't have type declaration
import { ufs } from 'unionfs'


mfs.mkdirSync("/build")

mfs.mkdirSync("/site")
  mfs.writeFileSync("/site/index.jsx", "export default () => <h1>hi</h1>")

mfs.mkdirSync("/data")
  mfs.writeFileSync("/data/index.js", "module.exports = {}")


it("compiles functional page without data", async () => {
  
  expect.assertions(1)

  jest.setTimeout(60000)

  await build({
    fs: ufs.use(mfs).use(nfs)
  }, true).then(v => {
    expect(mfs.readFileSync("/build/index.html").toString()).toBe("<!DOCTYPE html><h1>hi</h1>")
  }).catch(console.error)

})
