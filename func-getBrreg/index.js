const { logger } = require("@vestfoldfylke/loglady")
const HTTPError = require("../sharedcode/vtfk-errors/httperror")

module.exports = async (context, req) => {
	// Authentication / Authorization
	await require("../sharedcode/auth/auth").auth(req)

	// Get ID from request
	const id = context.bindingData.id
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
