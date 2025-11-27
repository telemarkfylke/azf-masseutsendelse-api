const { logger } = require("@vestfoldfylke/loglady")
const getDb = require("../sharedcode/connections/masseutsendelseDB.js")
const Templates = require("../sharedcode/models/templates.js")
const { errorResponse, response } = require("../sharedcode/response/response-handler")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

module.exports = async (_context, req) => {
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
