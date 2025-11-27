const { logger } = require("@vestfoldfylke/loglady");
const getDb = require('../sharedcode/connections/masseutsendelseDB.js')
const Dispatches = require('../sharedcode/models/dispatches.js')
const { errorResponse, response } = require('../sharedcode/response/response-handler')
const HTTPError = require('../sharedcode/vtfk-errors/httperror')

module.exports = async function (context, req) {
  try {
    // Get the ID from the request
    const id = context.bindingData.id
    if (!id) {
      return new HTTPError(400, 'You cannot complete a dispatch without providing an id').toHTTPResponse()
    }

    // Authentication / Authorization
    const requestor = await require('../sharedcode/auth/auth').auth(req)

    // Await the DB connection
    await getDb()

    // Get the existing dispatch object
    const existingDispatch = await Dispatches.findById(id).lean()
    if (!existingDispatch) {
      return new HTTPError(404, `Dispatch with id ${id} could not be found`).toHTTPResponse()
    }
    if (existingDispatch.status !== 'approved') {
      return new HTTPError(404, 'Cannot complete a dispatch that is not approved').toHTTPResponse()
    }

    // Set completed information
    const completedData = {
      status: 'completed',
      owners: [],
      excludedOwners: [],
      matrikkelUnitsWithoutOwners: [],
      modifiedTimestamp: new Date(),
      modifiedBy: requestor.name,
      modifiedByEmail: requestor.email,
      modifiedByDepartment: requestor.department,
      modifiedById: requestor.id
    }
    if (req.body?.e18Id) completedData.e18Id = req.body.e18Id

    // Update the dispatch
    const updatedDispatch = await Dispatches.findByIdAndUpdate(id, completedData, { new: true })

    return response(updatedDispatch)
  } catch (err) {
    logger.errorException(err, 'Failed to put completed dispatch')
    return errorResponse(err, 'Failed to put completed dispatch', 400)
  }
}
