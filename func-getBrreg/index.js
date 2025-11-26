const HTTPError = require('../sharedcode/vtfk-errors/httperror')

module.exports = async function (context, req) {
  // Authentication / Authorization
  await require('../sharedcode/auth/auth').auth(req)

  // Get ID from request
  const id = context.bindingData.id
  if (!id) {
    return new HTTPError(400, 'No dispatch id was provided').toHTTPResponse()
  }

  // Make the request
  const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    // TODO: log error with loglady
    return new HTTPError(response.status, `Brreg responded with status code ${response.status} for id ${id}: ${response.statusText}`).toHTTPResponse()
  }

  return await response.json()
}
