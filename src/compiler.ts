import React from "react"
import ReactDOMServer from "react-dom/server"
import { JsxsConfig } from "./config"
import { getData } from "./data"

const DOCTYPE = "<!DOCTYPE html>"

export function genHTML(config: JsxsConfig, source: string): string {
  const page = eval(source).default(getData(config))
  if(React.isValidElement(page)) {
    const html = DOCTYPE + ReactDOMServer.renderToStaticMarkup(page)
    if(config.hooks && config.hooks.postProcess) return config.hooks.postProcess(html)
    else return html
  } else {
    console.error("not a valid react element")
    return "<h1>not a valid react element</h1>" //TODO: make a better error page
  }
}