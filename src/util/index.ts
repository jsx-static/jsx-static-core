function isClass(val: any): boolean { // janky hack
  try {
    val() // classes cannot be called as though they are a function
    return false
  } catch(e) { return true }
}

export {
  isClass
}