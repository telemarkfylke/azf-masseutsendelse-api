const { STATUS_CODES } = require("node:http")
const HTTPError = require("../vtfk-errors/httperror")

/**
 * @param {number} statusCode
 * @returns {string}
 */
const httpStatusCodeToDescription = (statusCode) => {
	if (!STATUS_CODES[statusCode]) {
		return "Unknown status code"
	}

	const suffix = ((statusCode / 100) | 0) === 4 || ((statusCode / 100) | 0) === 5 ? "Error" : ""
	const statusName = STATUS_CODES[statusCode].replace(/error$/i, "").replace(/ /g, "")
	return `${statusName}${suffix}`
}

/**
 * @param data
 * @param {number} statusCode
 * @returns {{status: number, statusDescription: string, headers: {"Content-Type": string}, body: *}}
 */
const response = (data, statusCode = 200) => {
	const contentType = typeof data === "object" ? "application/json; charset=utf-8" : "plain/text; charset=utf-8"

	return {
		status: statusCode,
		statusDescription: httpStatusCodeToDescription(statusCode),
		headers: {
			"Content-Type": contentType
		},
		body: data
	}
}

/**
 * @param {Error | HTTPError | string} error
 * @param {string} title - optional title for the error
 * @param {number} statusCode - optional status code, default is 200. If status is found in error, it will be used instead.
 * @returns {{status: any, headers: {"Content-Type": string}, statusDescription: any, body: {error: {statusName: any, statusCode: any, title: any, message: string, errors: any}, documentation: any | {}}}}
 */
const errorResponse = (error, title = "", statusCode = 200) => {
	if (error instanceof HTTPError) {
		return error.toHTTPResponse()
	}

	if (error instanceof Error) {
		return new HTTPError(statusCode, error.message, title || error.name).toHTTPResponse()
	}

	const contentType = typeof error === "object" ? "application/json; charset=utf-8" : "plain/text; charset=utf-8"
	return {
		status: statusCode,
		statusDescription: httpStatusCodeToDescription(statusCode),
		headers: {
			"Content-Type": contentType
		},
		body: {
			error: {
				statusName: httpStatusCodeToDescription(statusCode),
				statusCode: statusCode,
				message: ["string", "number", "boolean"].includes(typeof error) ? error : JSON.stringify(error),
				title: title || "Error",
				errors: null
			}
		}
	}
}

module.exports = {
	response,
	errorResponse
}
