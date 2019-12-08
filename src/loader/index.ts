import path from "path"

import { getOptions } from 'loader-utils'

import { writeFiles } from "../compiler"
import { genData } from "../dataLoader"

export default function(source: string) {
    const options = getOptions(this) //TODO: validation
    
    const data = genData(options.buildConfig)
    writeFiles([{ source, name: path.basename(this.resource).replace(".jsx", ".html") }], options.buildConfig, data)
    
    return source
}