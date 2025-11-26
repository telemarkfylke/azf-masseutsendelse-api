const { azfHandleError } = require('@vtfk/responsehandlers')
const { getReadyDispatchesV2 } = require('../sharedcode/funcs/getReadyDispatchesV2.js')
const { alertTeams } = require('../sharedcode/helpers/alertTeams.js')

module.exports = async function (context, req) {
  try {
    return await getReadyDispatchesV2(context, req)
  } catch (err) {
    await alertTeams(err, 'error', 'func-getreadydispatchesV2 failed', [], 'no id found', context.executionContext.functionName)
    return await azfHandleError(err, context, req)
  }
}
