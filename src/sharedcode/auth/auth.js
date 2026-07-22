const { logger } = require("@vestfoldfylke/loglady");
const azureAd = require("./lib/azuread");

const testUser = {
  name: "timetrigger",
  id: "timetrigger",
  department: "timetrigger",
  email: "timetrigger@telemarkfylke.no"
};

/**
 * Auth's the request
 * @param {object} req Azure function request
 * @returns
 */
async function auth(req) {
  if (process.env.NODE_ENV?.toLowerCase() === "test") {
    // Return a default timetrigger user in test mode since no auth header is provided
    return testUser;
  }

  const authValue = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authValue) {
    if (process.env.NODE_ENV?.toLowerCase() !== "development") {
      throw new Error("No authorization header was provided");
    }

    // Return a dev user in development mode since no auth header is provided - for testing against web
    logger.warn("Using a development user based on AUTH_DEVELOPMENT_* env variables");
    return {
      name: process.env.AUTH_DEVELOPMENT_NAME ?? testUser.name,
      id: process.env.AUTH_DEVELOPMENT_ID ?? testUser.id,
      department: process.env.AUTH_DEVELOPMENT_DEPARTMENT ?? testUser.department,
      email: process.env.AUTH_DEVELOPMENT_EMAIL ?? testUser.email
    };
  }

  const token = await azureAd(authValue);
  if (!token) {
    return {};
  }

  const requestor = {};
  if (token.name) {
    requestor.name = token.name;
  }
  if (token.oid) {
    requestor.id = token.oid;
  }
  // Department is fetched with graph, not from access or id token from auth process.
  if (token.department) {
    requestor.department = token.department;
  }
  if (token.upn) {
    requestor.email = token.upn;
  }

  return requestor;
}

module.exports.auth = auth;
