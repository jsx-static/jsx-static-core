import { build } from "../src/index"
import { getPath } from "../src/util/file"

import { fs as mfs, vol } from "memfs"

it("compiles functional page without data", async () => {
  mfs.mkdirSync("/site")
  mfs.mkdirSync("/build")
  mfs.writeFileSync("/site/index.jsx", "export default () => <h1>hi</h1>")
  mfs.mkdirSync("/data")
  mfs.writeFileSync("/data/index.js", "module.exports = {}")
  
  expect.assertions(1)

  jest.setTimeout(60000)

  await build({
    fs: mfs
  }, true).then(v => {
    expect(mfs.readFileSync("/build/index.html").toString()).toBe("<!DOCTYPE html><h1>hi</h1>")
  }).catch(console.log)

})