const { logger } = require("@vestfoldfylke/loglady")
const { app } = require("@azure/functions")
const getDb = require("../sharedcode/connections/masseutsendelseDB.js")
const Templates = require("../sharedcode/models/templates.js")
const { errorResponse, response } = require("../sharedcode/response/response-handler")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

const getTemplates = async (req) => {
	try {
		// Authentication / Authorization
		await require("../sharedcode/auth/auth").auth(req)

		// Await the db connection.
		await getDb()

		// Find all the templates
		const templates = await Templates.find({})
		if (!templates) {
			return new HTTPError(404, "No templates found in the databases").toHTTPResponse()
		}

		// Return the Templates
		return response(templates)
	} catch (err) {
		logger.errorException(err, "Failed to get templates")
		return errorResponse(err, "Failed to get templates", 400)
	}
}

app.http("getTemplates", {
	authLevel: "anonymous",
	handler: getTemplates,
	methods: ["GET"],
	route: "templates"
})

module.exports = { getTemplates }
