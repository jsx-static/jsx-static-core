# jsx-static-core
A proper static site generator using jsx.

## What this is
This is a way to create a static site from data using React and jsx technology. However it is a static site, which means that React will not be included in the final webpage.

## What this is not
This is not a way to create a webapp. This is a way to create a static site. This should be used to create something like Wikipedia but not something like Twitter.

## Planned features
Jsx static is still very young and there are many missing features, these are the planned features in roughly order of importance:
- Native style compilation (~~Sass~~, Less, Stylus)
- Arbitrary asset data injection
- Async data injection
- Middle ware plugins for making site generation even easier
  - markdown processor

If you don't see something you want feel free to make an issue.

---

# Docs

## Installation
Be sure to have both node and npm installed.
install jsx-static-scripts:
```
npm install -g jsx-static-scripts
```
This exposes a script to install, and manage jsxs projects.
To create a project:
```
jsxs init [project directory]
```
cd into your project then to start and serve a project:
```
npm start
```
And that's it, you now have a jsxs project. There are other options but they are not covered here, use the help command.

## Introduction
Each file in the site directory (by default `/site`) becomes a webpage. This is done by compiling the exported react component into HTML. For example:

```jsx
export default props => 
<html lang="en">
<head>
  <meta charSet="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta httpEquiv="X-UA-Compatible" content="ie=edge">
  <title>Hello jsxs</title>
</head>
<body>
  <h1>Hello jsxs!</h1>
</body>
</html>
```

will get compiled to

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charSet="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta httpEquiv="X-UA-Compatible" content="ie=edge">
  <title>Hello jsxs</title>
</head>
<body>
  <h1>Hello jsxs!</h1>
</body>
</html>
```

Lets say you don't want to write that html-5 boilerplate every time you create a page, we can make a component (by default located in `/components/`)

```jsx
// components/Html.jsx
export default props => 
<html lang="en">
<head>
  <meta charSet="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta httpEquiv="X-UA-Compatible" content="ie=edge">
  <title>{ props.title }</title>
</head>
<body>
  { props.children }
</body>
</html>
```

Now we can refactor our original page to be:

```jsx
import Html from "Html.jsx"
export default props => 
<Html title="Hello jsxs">
  <h1>Hello jsxs</h1>
</Html>
```


This is a bit useless so far. The main reason you may want to use this is for the data injection. By creating a data file (by default `/data/index.js`) that data will be compiled and injected into every page. For example:

```js
// data/index.js
global.jsxsData = {
  hello: "Hello jsxs"
}
```

Then we can refactor the original page to be:

```jsx
import Html from "Html.jsx"
export default props => 
<Html title={ props.hello }>
  <h1>{ props.hello }</h1>
</Html>
```

## Class based pages
Jsxs also supports class based pages

```jsx
import Html from "Html.jsx"
export default class extends React.Component {
  constructor(data) { // data is the data gathered from the data file
    super(data)
  }

  render() {
    return 
    <Html title="class based">
      <h1>This will compile all the same</h1>
    </Html>
  }
}
```

## Iteration
Many times you may want to generate many files from one template, such as for a blog. We can do this easily in jsxs by using the `iterator` function inside a class based component.

First start with some data:

```js
// data/index.js
global.jsxsData = {
  blogPosts: [
    {
      title: "Why turtles are great",
      content: "They are turtles what more do you need!"
    },
    {
      title: "How to use markdown with these coming soon",
      content: "Its really easy and I'm sure you could figure it out, add a md compiler and read files in the data file"
    },
    {
      title: "Why My cat is amazing",
      content: "Can you tell I am running out of ideas for the names of these blog posts?"
    }
  ]
}
```

Next create the template:

```jsx
import Html from "Html.jsx"

export default class extends React.Component {
  constructor(props) {
    super(props)
  }

  iterator() { // using this function allows you to create multiple pages from a single template file
    return this.props.blogPosts.map(blogPost => ({
      filename: blogPost.title + ".html",
      data: blogPost // this data will be passed to the render method
    }))
  }

  // render will be called for each of the elements in the array returned from iterator
  render(instanceData) { 
    return 
    <Html title={`Blog - ${ instanceData.title }`}>
      <h1>{ instanceData.title }</h1>
      <p>{ instanceData.content }</p>
    </Html>
  }
}
```

This will output 3 files named `Why turtles are great.html`, `How to use markdown with these coming soon.html`, and `Why My cat is amazing.html`, with bodies exactly how you would expect.

---

# Licence
MIT
