const { STATUS_CODES } = require('http')

/**
 * @param {number} statusCode
 * @returns {string}
 */
const httpStatusCodeToDescription = (statusCode) => {
  if (!STATUS_CODES[statusCode]) {
    return 'Unknown status code'
  }

  const suffix = (statusCode / 100 | 0) === 4 || (statusCode / 100 | 0) === 5 ? 'Error' : ''
  const statusName = STATUS_CODES[statusCode].replace(/error$/i, '').replace(/ /g, '')
  return `${statusName}${suffix}`
}

/**
 * @param data
 * @param {number} statusCode
 * @returns {{status: number, statusDescription: string, headers: {"Content-Type": string}, body: *}}
 */
const response = (data, statusCode = 200) => {
  const contentType = typeof data === 'object' ? 'application/json; charset=utf-8' : 'plain/text; charset=utf-8'

  return {
    status: statusCode,
    statusDescription: httpStatusCodeToDescription(statusCode),
    headers: {
      'Content-Type': contentType
    },
    body: data
  }
}

module.exports = {
  response
}