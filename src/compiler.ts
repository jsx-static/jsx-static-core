import React from "react"
import ReactDOMServer from "react-dom/server"

const DOCTYPE = "<!DOCTYPE html>"

export function genHTML(source: string): string {
  const page = eval(source).default()
  if(React.isValidElement(page)) {
    return DOCTYPE + ReactDOMServer.renderToString(page)
  } else {
    console.error("not a valid react element")
    return "big oof"
  }
}