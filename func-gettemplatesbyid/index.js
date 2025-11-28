const { logger } = require("@vestfoldfylke/loglady")
const { app } = require("@azure/functions")
const getDb = require("../sharedcode/connections/masseutsendelseDB.js")
const Templates = require("../sharedcode/models/templates.js")
const { errorResponse, response } = require("../sharedcode/response/response-handler")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

const getTemplatesById = async (req) => {
	try {
		// Authentication / Authorization
		await require("../sharedcode/auth/auth").auth(req)

		// Get ID from request
		const id = req.params.id

		if (!id) {
			return new HTTPError(400, "No template id was provided").toHTTPResponse()
		}

		// Await the database
		await getDb()

		// Find Template by ID
		const template = await Templates.findById(id)
		if (!template) {
			return new HTTPError(400, `Template with id ${id} could no be found`).toHTTPResponse()
		}

		// Return the template object
		const requestBody = await req.json()
		const templateById = await Templates.findById(id, requestBody, { new: true })

		return response(templateById)
	} catch (err) {
		logger.errorException(err, "Failed to get templates by id")
		return errorResponse(err, "Failed to get template by id", 400)
	}
}

app.http("getTemplatesById", {
	authLevel: "anonymous",
	handler: getTemplatesById,
	methods: ["GET"],
	route: "templates/{id}"
})

module.exports = { getTemplatesById }
