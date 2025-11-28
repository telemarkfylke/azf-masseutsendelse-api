const { logger } = require("@vestfoldfylke/loglady")
const { app } = require("@azure/functions")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

const getBRReg = async (req) => {
	// Authentication / Authorization
	await require("../sharedcode/auth/auth").auth(req)

	// Get ID from request
	const id = req.params.id
	if (!id) {
		return new HTTPError(400, "No dispatch id was provided").toHTTPResponse()
	}

	// Make the request
	const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${id}`, {
		method: "GET",
		headers: {
			Accept: "application/json"
		}
	})

	if (!response.ok) {
		const errorData = await response.text()
		logger.error("Failed to get data for EnhetId {EnhetId} from BRReg. Status: {Status}: {StatusText}: {@ErrorData}", id, response.status, response.statusText, errorData)
		return new HTTPError(response.status, `BRReg responded with status code ${response.status} for id ${id}: ${response.statusText}`).toHTTPResponse()
	}

	return await response.json()
}

app.http("getBRReg", {
	authLevel: "anonymous",
	handler: getBRReg,
	methods: ["GET"],
	route: "brreg/{id}"
})
