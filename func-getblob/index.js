const { logger } = require("@vestfoldfylke/loglady");
const blobClient = require('@vtfk/azure-blob-client')
const { response } = require('../sharedcode/response/response-handler')
const HTTPError = require('../sharedcode/vtfk-errors/httperror')

module.exports = async function (context, req) {
  try {
    // Authentication / Authorization
    await require('../sharedcode/auth/auth').auth(req)

    // Input validation
    if (!context.bindingData.id) {
      return new HTTPError(400, 'dispatchId must be specified').toHTTPResponse()
    }
    if (!context.bindingData.name) {
      return new HTTPError(400, 'name must be specified').toHTTPResponse()
    }

    // Retrieve the file
    if (process.env.NODE_ENV !== 'test') {
      const file = await blobClient.get(`${context.bindingData.id}/${context.bindingData.name}`)
      if (!file || !file.data) {
        return new HTTPError(404, 'No files found, check if you passed the right filename and/or the right dispatchId').toHTTPResponse()
      }

      // Return the file
      return response(file)
    }

    if (!context.bindingData.file) {
      return new HTTPError(400, 'No Files found').toHTTPResponse()
    }
    
    return response(context.bindingData.file)
  } catch (err) {
    logger.errorException(err, 'Failed to get blob')
    return response('Failed to get blob', 400)
  }
}
