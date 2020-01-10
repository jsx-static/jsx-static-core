import React from "react"
import ReactDOMServer from "react-dom/server"
import { JsxsConfig } from "./config"
import { isReactClass } from "./util"

const DOCTYPE = "<!DOCTYPE html>"

export interface Compilation {
  html: string,
  filename: string
}

function getHTML(config: JsxsConfig, page: object, filename: string): string {
  if(React.isValidElement(page)) {
    let html = DOCTYPE + ReactDOMServer.renderToStaticMarkup(page)
    return html
  } else {
    if(config.hooks && config.hooks.compileError) config.hooks.compileError(`(${ filename }) is not a valid react element`)
    return "<h1>not a valid react element</h1>" //TODO: make a better error page
  }
}

export function compilePage(config: JsxsConfig, filename: string, source: string, data: any): Compilation[] {
  try {
    let component = eval(source).default
    
    const isClass = isReactClass(component)
    
    if(isClass) {
      const page = new component(data)
      if(page.iterator) {
        const iteratorData = page.iterator()
        if(Array.isArray(iteratorData)) {
          return iteratorData.map(instanceData => ({
            html: getHTML(config, page.render(instanceData.data), instanceData.filename),
            filename: instanceData.filename
          }))
        } else {
          if(config.hooks && config.hooks.compileError) config.hooks.compileError(`(${ filename }) Data returned from \`iterator\` must be an array!`)
          console.error(`(${ filename }) Data returned from \`iterator\` must be an array!`)
          return [] // nothing returned because the iterator is basically empty
        }
      } else {
        return [{
          html: getHTML(config, new component(data).render(), filename),
          filename
        }]
      }
    } else {
      return [{
        html: getHTML(config, component(data), filename),
        filename
      }]
    }
  } catch(err) {
    config.hooks && config.hooks.compileError && config.hooks.compileError(err)
    console.error(`(${ filename }) Component threw an error: ${err}`)
    return []
  }
}