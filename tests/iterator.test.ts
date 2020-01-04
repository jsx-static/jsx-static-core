import jsxs from "../src/index"
import fs from "fs"
import MemoryFileSystem from "memory-fs"
import { fs as mfs, vol } from 'memfs'
import { ufs } from "unionfs"
import path from "path"

const numberObjStr = `{
  pages: [ "one", "two", "three", "four", "five" ]
}`

const numbers = eval(numberObjStr)

const fileData = {
  "/site/Iterator Page.jsx": `export default class {
    constructor(props) {
      super(props)
    }

    iterator() {
      return this.props.pages.map(page => ({
        filename: page + ".html",
        data: page
      }))
    }

    render(instance) {
      return <h1>{ instance }</h1>
    }
  }`,
  "/data/index.js": `export default ` + numberObjStr
}

vol.fromJSON(fileData)

const outputFs = new MemoryFileSystem()

beforeAll(() => 
  jsxs.build({
    inputFs: ufs.use(mfs).use(fs), // mfs for the site, fs for node_modules
    outputFs
  })  
)

for(let number in numbers) {
  test(`${number} instance compiles successfully`, () => {
    expect(outputFs.data["build"][`${number}.html`].toString())
      .toBe(`<!DOCTYPE html><h1>${number}</h1>`)
  })
}