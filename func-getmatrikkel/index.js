/*
  Import dependencies
*/
const HTTPError = require('../sharedcode/vtfk-errors/httperror')
const { MATRIKKEL } = require('../config')
const getAccessToken = require('../sharedcode/helpers/get-entraid-token')

module.exports = async function (context, req) {
  // Authentication / Authorization
  await require('../sharedcode/auth/auth').auth(req)

  // Input validation
  if (!MATRIKKEL.MATRIKKEL_BASEURL) {
    return new HTTPError(400, 'The MatrikkelProxyAPI connection is not configured').toHTTPResponse()
  }
  if (!MATRIKKEL.MATRIKKEL_KEY) {
    return new HTTPError(400, 'The MatrikkelProxyAPI connection is missing the APIKey').toHTTPResponse()
  }

  let accessToken
  try {
    accessToken = await getAccessToken(MATRIKKEL.MATRIKKEL_SCOPE)
  } catch (error) {
    return new HTTPError(400, 'Something went wrong fetching the accessToken').toHTTPResponse()
  }

  // Get ID from request
  const endpoint = decodeURIComponent(context.bindingData.endpoint)
  const response = await fetch(`${MATRIKKEL.MATRIKKEL_BASEURL}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-functions-key': MATRIKKEL.MATRIKKEL_KEY
    },
    body: JSON.stringify(req.body)
  })

  if (!response.ok) {
    // TODO: log error with loglady
    return new HTTPError(response.status, `MatrikkelProxyAPI responded with status ${response.status}: ${response.statusText}`).toHTTPResponse()
  }

  return await response.json()
}
