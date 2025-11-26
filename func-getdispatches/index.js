const { logger } = require("@vestfoldfylke/loglady");
const getDb = require('../sharedcode/connections/masseutsendelseDB.js')
const Dispatches = require('../sharedcode/models/dispatches.js')
const { response } = require('../sharedcode/response/response-handler')

module.exports = async function (context, req) {
  try {
    // Authentication / Authorization
    await require('../sharedcode/auth/auth').auth(req)

    // Await the DB connection
    await getDb()

    // Find all dispatches
    let dispatches = []
    if (req.query?.full === true || req.query?.full === 'true') dispatches = await Dispatches.find({})
    else dispatches = await Dispatches.find({}).select('-owners -excludedOwners -matrikkelUnitsWithoutOwners')

    // If no dispatches was found
    if (!dispatches) dispatches = []

    // Return the dispatches
    return response(dispatches)
  } catch (err) {
    logger.errorException(err, 'Failed to get dispatches')
    return response('Failed to get dispatches', 400)
  }
}
