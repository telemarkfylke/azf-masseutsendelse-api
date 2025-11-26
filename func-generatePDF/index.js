const { logger } = require('@vestfoldfylke/loglady')
const { azfHandleResponse } = require('@vtfk/responsehandlers')
const { PDFGENERATOR } = require('../config')
const HTTPError = require('../sharedcode/vtfk-errors/httperror')

module.exports = async function (context, req) {
  // Get data from request and validate
  const preview = context.bindingData.preview
  const template = context.bindingData.template
  const documentDefinitionId = context.bindingData.documentDefinitionId
  const data = context.bindingData.data

  if (!preview) {
    return new HTTPError(400, 'Preview must provided').toHTTPResponse()
  }
  if (!template) {
    return new HTTPError(400, 'Template must be provided').toHTTPResponse()
  }
  if (!documentDefinitionId) {
    return new HTTPError(400, 'DocumentDefinitionId must be provided').toHTTPResponse()
  }
  if (!data) {
    return new HTTPError(400, 'Data must be provided').toHTTPResponse()
  }

  // Build request
  const requestData = {
    preview,
    template,
    documentDefinitionId,
    data
  }

  // Define headers
  const headers = {
    'x-functions-key': PDFGENERATOR.PDFGENERATOR_X_FUNCTIONS_KEY
  }

  // Make the request
  const response = await fetch(PDFGENERATOR.PDFGENERATOR_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestData)
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    logger.error('Failed to create a pdf. Status: {Status}: {StatusText}: {@ErrorData}', response.status, response.statusText, errorData)
    return new HTTPError(response.status, `Error from PDF Generator: ${response.statusText}`).toHTTPResponse()
  }

  return await azfHandleResponse(request.data, context, req, 200)
}
