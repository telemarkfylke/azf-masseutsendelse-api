const { app } = require("@azure/functions")
const { logger } = require("@vestfoldfylke/loglady")
const utils = require("@vtfk/utilities")
const getDb = require("../sharedcode/connections/masseutsendelseDB.js")
const Templates = require("../sharedcode/models/templates.js")
const { errorResponse, response } = require("../sharedcode/response/response-handler")

const postTemplate = async (req) => {
	try {
		// Authentication / Authorization
		const requestor = await require("../sharedcode/auth/auth").auth(req)

		// Strip away some fields that should not be able to be set by the request
		const rawRequestBody = await req.json()
		const requestBody = utils.removeKeys(rawRequestBody, [
			"createdTimestamp",
			"createdBy",
			"createdById",
			"createdByDepartment",
			"modifiedTimestamp",
			"modifiedBy",
			"modifiedById",
			"modifiedByDepartment"
		])

		// Await database connection
		await getDb()

		// Set some default values
		requestBody.version = 1
		requestBody.createdBy = requestor.name
		requestBody.createdById = requestor.id
		requestBody.createdByDepartment = requestor.department
		requestBody.modifiedBy = requestor.name
		requestBody.modifiedById = requestor.id
		requestBody.modifiedByDepartment = requestor.department

		// Create a new document from model
		const template = new Templates(requestBody)

		// Save the template to the database
		const result = await template.save()

		// Return the result
		return response(result)
	} catch (err) {
		logger.errorException(err, "Failed to post template")
		return errorResponse(err, "Failed to post template", 400)
	}
}

app.http("postTemplate", {
	authLevel: "anonymous",
	handler: postTemplate,
	methods: ["POST"],
	route: "templates"
})

module.exports = { postTemplate }
