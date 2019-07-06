import { getPath } from "./util/file"
import { BuildConfig } from "./config"

function prepareWorkspace(config: BuildConfig) {
  if(!config.fs.existsSync(getPath(config.siteDir)))      config.fs.mkdirSync(getPath(config.siteDir))
  if(!config.fs.existsSync(getPath(config.outputDir)))    config.fs.mkdirSync(getPath(config.outputDir))
  if(!config.fs.existsSync(getPath(config.componentDir))) config.fs.mkdirSync(getPath(config.componentDir))
}

function testWorkspace(config: BuildConfig): boolean {
  let valid: boolean = true
  if(!config.fs.existsSync(getPath(config.siteDir))) {
    valid = false
    console.error(`${config.siteDir} does not exisxt`)
  }
  if(!config.fs.existsSync(getPath(config.outputDir))) {
    valid = false
    console.error(`${config.outputDir} does not exisxt`)
  }
  if(!config.fs.existsSync(getPath(config.componentDir))) {
    console.warn(`${config.componentDir} does not exisxt`)
  }
  return valid
}

export {
  prepareWorkspace,
  testWorkspace
}