const { app } = require("@azure/functions")
const { handleJobs } = require("../sharedcode/funcs/handleJobs")

const getHandleJobs = async (_req, context) => {
	return await handleJobs(context, "auto")
}

app.timer("getHandleJobsTimer", {
	schedule: "0 */10 1 * * *", // Every 10 minutes between 01:00 - 01:59
	handler: getHandleJobs
})
