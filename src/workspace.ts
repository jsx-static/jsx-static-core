import * as fs from "fs"

import { getPath } from "./util"
import { BuildConfig } from "./config"

function prepareWorkspace(config: BuildConfig) {
  if(!fs.existsSync(getPath(config.siteDir))) fs.mkdirSync(getPath(config.siteDir))
  if(!fs.existsSync(getPath(config.outputDir))) fs.mkdirSync(getPath(config.outputDir))
  if(!fs.existsSync(getPath(config.componentDir))) fs.mkdirSync(getPath(config.componentDir))
}

function testWorkspace(config: BuildConfig): boolean {
  let valid: boolean = true
  if(!fs.existsSync(getPath(config.siteDir))) {
    valid = false
    console.error(`${config.siteDir} does not exisxt`)
  }
  if(!fs.existsSync(getPath(config.outputDir))) {
    valid = false
    console.error(`${config.outputDir} does not exisxt`)
  }
  if(!fs.existsSync(getPath(config.componentDir))) {
    console.warn(`${config.componentDir} does not exisxt`)
  }
  return valid
}

export {
  prepareWorkspace,
  testWorkspace
}