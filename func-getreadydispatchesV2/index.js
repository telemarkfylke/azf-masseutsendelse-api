const { logger } = require("@vestfoldfylke/loglady")
const { getReadyDispatchesV2 } = require("../sharedcode/funcs/getReadyDispatchesV2.js")
const { alertTeams } = require("../sharedcode/helpers/alertTeams.js")
const { errorResponse } = require("../sharedcode/response/response-handler")

module.exports = async (context, req) => {
	try {
		return await getReadyDispatchesV2(context, req)
	} catch (err) {
		await alertTeams(err, "error", "func-getreadydispatchesV2 failed", [], "no id found", context.executionContext.functionName)
		logger.errorException(err, "Failed to get ready dispatches V2")
		return errorResponse(err, "Failed to get ready dispatches V2", 400)
	}
}
