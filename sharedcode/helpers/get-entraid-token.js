const { ConfidentialClientApplication } = require("@azure/msal-node");
const { logger } = require("@vestfoldfylke/loglady");
const NodeCache = require("node-cache");
const { ARCHIVE, MASSEUTSENDELSE, MATRIKKEL, MS, GRAPH } = require("../../config");

const cache = new NodeCache({ stdTTL: 3000 });

module.exports = async (scope, options = { forceNew: false }) => {
  const cacheKey = scope;

  if (!options.forceNew && cache.get(cacheKey)) {
    return cache.get(cacheKey);
  }

  logger.info("No token in cache, fetching new from Microsoft");
  let clientID;
  let clientSecret;
  if (scope === ARCHIVE.ARCHIVE_SCOPE) {
    logger.info("Found matching scope, current scope: {Scope}", scope);
    clientID = MASSEUTSENDELSE.MASSEUTSENDELSE_APP_REG_CLIENT_ID;
    clientSecret = MASSEUTSENDELSE.MASSEUTSENDELSE_APP_REG_CLIENT_SECRET;
  } else if (scope === MATRIKKEL.MATRIKKEL_SCOPE) {
    logger.info("Found matching scope, current scope: {Scope}", scope);
    clientID = MASSEUTSENDELSE.MASSEUTSENDELSE_APP_REG_CLIENT_ID;
    clientSecret = MASSEUTSENDELSE.MASSEUTSENDELSE_APP_REG_CLIENT_SECRET;
  } else if (scope === MASSEUTSENDELSE.MASSEUTSENDELSE_SCOPE) {
    logger.info("Found matching scope, current scope {Scope}", scope);
    clientID = MATRIKKEL.MATRIKKEL_APP_REG_CLIENT_ID;
    clientSecret = MATRIKKEL.MATRIKKEL_APP_REG_CLIENT_SECRET;
  } else if (scope === GRAPH.GRAPH_SCOPE) {
    logger.info("Found matching scope, current scope {Scope}", scope);
    clientID = MASSEUTSENDELSE.MASSEUTSENDELSE_APP_REG_CLIENT_ID;
    clientSecret = MASSEUTSENDELSE.MASSEUTSENDELSE_APP_REG_CLIENT_SECRET;
  } else {
    logger.error("Didnt find any matching scope, current scope: {Scope}", scope);
  }

  const config = {
    auth: {
      clientId: clientID,
      authority: `https://login.microsoftonline.com/${MS.TENANT_ID}/`,
      clientSecret
    },
    cache: {
      claimsBasedCachingEnabled: true
    },
    system: {
      allowPlatformBroker: true
    }
  };

  // Create msal application object
  const cca = new ConfidentialClientApplication(config);
  const clientCredentials = {
    scopes: [scope]
  };

  const token = await cca.acquireTokenByClientCredential(clientCredentials);
  const expires = Math.floor((token.expiresOn.getTime() - Date.now()) / 1000);
  logger.info("Got token from Microsoft, expires in {Expires} seconds.", expires);
  cache.set(cacheKey, token.accessToken, expires);
  logger.info("Token stored in cache");

  return token.accessToken;
};
