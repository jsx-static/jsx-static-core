import * as nfs from "fs"
import * as path from "path"

import { build } from "../src/index"

import { fs as mfs, vol } from "memfs"

//@ts-ignore // unionfs doesn't have type declaration
import { ufs } from 'unionfs'

// create virtual file system
import files, { output } from "./samples/files"

vol.fromJSON(files)

// test general compiler
Object.entries(files).filter(f => f[0].indexOf("/site/") !== -1).forEach(f => {
  it(path.basename(f[0]).replace(".jsx", ""), async () => {
    jest.setTimeout(80000) // the processing time for the build function from scratch is pretty long
    
    await build({
      fs: ufs.use(mfs).use(nfs) // use pages stored in memory with other stuff stored in node_modules
    }, true).then(() => {
      expect(mfs.readFileSync((f[0].replace(".jsx", ".html").replace("/site/", "/build/")), "utf8")).toBe(output)
    }).catch(console.error)
  })
})