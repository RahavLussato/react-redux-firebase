import { flatMap, isArray, isObject, isString, remove } from 'lodash'
import { getPopulates } from './populate'
import { getQueryIdFromPath } from './query'

/**
 * @description Convert path string to object with queryParams, path, and populates
 * @param {String} path - Path that can contain query parameters and populates
 * @return {Object} watchEvents - Array of watch events
 */
export const pathStrToObj = (path) => {
  let pathObj = { path, type: 'value', isQuery: false }
  const queryId = getQueryIdFromPath(path)
  // If Query id exists split params from path
  if (queryId) {
    const pathArray = path.split('#')
    pathObj = Object.assign(
      {},
      pathObj,
      {
        queryId,
        isQuery: true,
        path: pathArray[0],
        queryParams: pathArray[1].split('&')
      }
    )
    if (getPopulates(pathArray[1].split('&'))) {
      pathObj.populates = getPopulates(pathArray[1].split('&'))
      pathObj.queryParams = remove(pathArray[1].split('&'), (p) => p.indexOf('populate') === -1)
    }
  }
  // if queryId does not exist, return original pathObj
  return pathObj
}

export const pathArrToObj = (path) => {
    let pathStr = path[0];

    let pathObjAdded = { pathStr, type: 'child_added', isQuery: false };
    let pathObjRemoved = { pathStr, type: 'child_removed', isQuery: false };
    let pathObjMoved = { pathStr, type: 'child_moved', isQuery: false };
    let pathObjChanged = { pathStr, type: 'child_changed', isQuery: false };

    const queryId = getQueryIdFromPath(pathStr);
    // If Query id exists split params from path
    if (queryId) {
        const pathArray = pathStr.split('#')
        let options = {
            queryId,
            isQuery: true,
            path: pathArray[0],
            queryParams: pathArray[1].split('&')
        }

        pathObjAdded = Object.assign({}, pathObjAdded, options)
        pathObjRemoved = Object.assign({}, pathObjRemoved, options)
        pathObjMoved = Object.assign({}, pathObjMoved, options)
        pathObjChanged = Object.assign({}, pathObjChanged, options)

        if (getPopulates(pathArray[1].split('&'))) {
            pathObjAdded.populates = getPopulates(pathArray[1].split('&'))
            pathObjAdded.queryParams = remove(pathArray[1].split('&'), (p) => p.indexOf('populate') === -1)

            pathObjRemoved.populates = getPopulates(pathArray[1].split('&'))
            pathObjRemoved.queryParams = remove(pathArray[1].split('&'), (p) => p.indexOf('populate') === -1)

            pathObjMoved.populates = getPopulates(pathArray[1].split('&'))
            pathObjMoved.queryParams = remove(pathArray[1].split('&'), (p) => p.indexOf('populate') === -1)

            pathObjChanged.populates = getPopulates(pathArray[1].split('&'))
            pathObjChanged.queryParams = remove(pathArray[1].split('&'), (p) => p.indexOf('populate') === -1)
        }
    }
    // if queryId does not exist, return original pathObj
    return [pathObjAdded,pathObjRemoved,pathObjMoved,pathObjChanged]
}

/**
 * @description Convert watch path definition array to watch events
 * @param {Array} paths - Array of path strings, objects, and arrays to watch
 * @return {Array} watchEvents - Array of watch events
 */
export const getEventsFromInput = paths =>
  flatMap(paths, (path) => {
    if (isString(path)) {
      return [ pathStrToObj(path) ]
    }

    if (isArray(path)) {
      // TODO: Handle input other than array with string
      // TODO: Handle populates within array
      return pathArrToObj(path)
    }

    if (isObject(path)) {
      if (!path.path) {
        throw new Error('Path is a required parameter within definition object')
      }
      let strPath = path.path

      if (path.queryParams) {
        // append query params to path for queryId added in pathStrToObj
        strPath = `${strPath}#${path.queryParams.join('&')}`
      }

      // Add all parameters that are missing (ones that exist will remain)
      path = Object.assign({}, pathStrToObj(strPath), path)
      return [ path ]
    }

    throw new Error(`Invalid Path Definition: ${path}. Only strings, objects, and arrays accepted.`)
  })

export default { getEventsFromInput }
