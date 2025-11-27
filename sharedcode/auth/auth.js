/*
  Import dependencies
*/
const azuread = require("./lib/azuread")
/*
  Auth function
*/
/**
 * Auth's the request
 * @param {object} req Azure function request
 * @returns
 */
async function auth(req) {
	if (!req.headers.authorization) {
		return {
			name: "timetrigger",
			id: "timetrigger",
			department: "timetrigger",
			email: "timetrigger@telemarkfylke.no"
		}
	}

	const token = await azuread(req.headers.authorization)
	if (!token) {
		return {}
	}

	const requestor = {}
	if (token.name) {
		requestor.name = token.name
	}
	if (token.oid) {
		requestor.id = token.oid
	}
	// Department is fetched with graph, not from access or id token from auth process.
	if (token.department) {
		requestor.department = token.department
	}
	if (token.upn) {
		requestor.email = token.upn
	}

	return requestor
}

module.exports.auth = auth
