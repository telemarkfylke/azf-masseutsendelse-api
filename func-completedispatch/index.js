const { logger } = require("@vestfoldfylke/loglady")
const { app } = require("@azure/functions")
const getDb = require("../sharedcode/connections/masseutsendelseDB.js")
const Dispatches = require("../sharedcode/models/dispatches.js")
const { errorResponse, response } = require("../sharedcode/response/response-handler")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

const completeDispatch = async (req) => {
	try {
		// Get the ID from the request
		const id = req.params.id
		if (!id) {
			return new HTTPError(400, "You cannot complete a dispatch without providing an id").toHTTPResponse()
		}

		// Authentication / Authorization
		const requestor = await require("../sharedcode/auth/auth").auth(req)

		// Await the DB connection
		await getDb()

		// Get the existing dispatch object
		const existingDispatch = await Dispatches.findById(id).lean()
		if (!existingDispatch) {
			return new HTTPError(404, `Dispatch with id ${id} could not be found`).toHTTPResponse()
		}
		if (existingDispatch.status !== "approved") {
			return new HTTPError(404, "Cannot complete a dispatch that is not approved").toHTTPResponse()
		}

		// Set completed information
		const completedData = {
			status: "completed",
			owners: [],
			excludedOwners: [],
			matrikkelUnitsWithoutOwners: [],
			modifiedTimestamp: new Date(),
			modifiedBy: requestor.name,
			modifiedByEmail: requestor.email,
			modifiedByDepartment: requestor.department,
			modifiedById: requestor.id
		}

		const requestBody = await req.json()
		if (requestBody?.e18Id) completedData.e18Id = requestBody.e18Id

		// Update the dispatch
		const updatedDispatch = await Dispatches.findByIdAndUpdate(id, completedData, { new: true })

		return response(updatedDispatch)
	} catch (err) {
		logger.errorException(err, "Failed to put completed dispatch")
		return errorResponse(err, "Failed to put completed dispatch", 400)
	}
}

app.http("completeDispatch", {
	authLevel: "anonymous",
	handler: completeDispatch,
	methods: ["PUT"],
	route: "dispatches/{id}/complete"
})

module.exports = { completeDispatch }
