import * as nfs from "fs"

import { build } from "../src/index"

import { fs as mfs } from "memfs"
//@ts-ignore // unionfs doesn't have type declaration
import { ufs } from 'unionfs'

mfs.mkdirSync("/build")

mfs.mkdirSync("/site")
  mfs.writeFileSync("/site/sf-nd.jsx", "export default () => <html>hi</html>")
  mfs.writeFileSync("/site/sf-d.jsx", "export default () => <html>hi</html>")

mfs.mkdirSync("/data")
  mfs.writeFileSync("/data/index.js", `module.exports = {}`)

it("compiles simple functional page without data", async () => {
  expect.assertions(1)
  jest.setTimeout(60000)

  await build({
    fs: ufs.use(mfs).use(nfs)
  }, true).then(v => {
    expect(mfs.readFileSync("/build/sf-nd.html").toString()).toBe("<!DOCTYPE html><html>hi</html>")
  }).catch(console.error)
})
