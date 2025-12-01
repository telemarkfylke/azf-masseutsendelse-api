const { logger } = require("@vestfoldfylke/loglady")
const { app } = require("@azure/functions")
const getDb = require("../sharedcode/connections/masseutsendelseDB.js")
const Dispatches = require("../sharedcode/models/dispatches.js")
const { errorResponse, response } = require("../sharedcode/response/response-handler")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

const getDispatchById = async (req) => {
	try {
		// Authentication / Authorization
		await require("../sharedcode/auth/auth").auth(req)

		// Get ID from request
		const id = req.params.id
		if (!id) {
			return new HTTPError(400, "No dispatch id was provided").toHTTPResponse()
		}

		// Await the database
		await getDb()

		// Find Dispatch by ID
		const dispatch = await Dispatches.findById(id)
		if (!dispatch) {
			return new HTTPError(404, `Dispatch with id ${id} could no be found`).toHTTPResponse()
		}

		// Return the dispatch object
		const requestBody = await req.json()
		const dispatchById = await Dispatches.findById(id, requestBody, { new: true })

		return response(dispatchById)
	} catch (err) {
		logger.errorException(err, "Failed to get dispatches by id")
		return errorResponse(err, "Failed to get dispatches by id", 400)
	}
}

app.http("getDispatchById", {
	authLevel: "anonymous",
	handler: getDispatchById,
	methods: ["GET"],
	route: "dispatches/{id}"
})

module.exports = { getDispatchById }
