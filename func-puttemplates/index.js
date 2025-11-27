const { logger } = require("@vestfoldfylke/loglady");
const utils = require('@vtfk/utilities')
const getDb = require('../sharedcode/connections/masseutsendelseDB.js')
const Templates = require('../sharedcode/models/templates.js')
const HTTPError = require('../sharedcode/vtfk-errors/httperror')
const { errorResponse, response } = require('../sharedcode/response/response-handler')

module.exports = async function (context, req) {
  try {
    // Authentication / Authorization
    const requestor = await require('../sharedcode/auth/auth').auth(req)

    // Strip away som fields that should not bed set by the request.
    req.body = utils.removeKeys(req.body, ['createdTimestamp', 'createdBy', 'createdById', 'modifiedTimestamp', 'modifiedBy', 'modifiedById'])

    // Update modified by
    req.body.modifiedBy = requestor.name
    req.body.modifiedById = requestor.id
    req.body.modifiedTimestamp = new Date()
    req.body.modifiedByDepartment = requestor.department

    // Get ID from request
    const id = context.bindingData.id

    if (!id) {
      return new HTTPError(400, 'No template id was provided').toHTTPResponse()
    }

    // Await the database
    await getDb()

    // Get the existing record
    const existingTemplate = await Templates.findById(id).lean()
    if (!existingTemplate) {
      return new HTTPError(400, `Template with id ${id} could no be found`).toHTTPResponse()
    }

    // Increment the version number
    req.body.version = existingTemplate.version + 1

    // Update the template
    const updatedTemplate = await Templates.findByIdAndUpdate(id, req.body, { new: true })

    return response(updatedTemplate)
  } catch (err) {
    logger.errorException(err, 'Failed to put templates')
    return errorResponse(err, 'Failed to put templates', 400)
  }
}
