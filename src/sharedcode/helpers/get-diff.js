const { isValidObjectId } = require("mongoose");

const getObjectIdValue = (id) => {
  if (isValidObjectId(id)) {
    return id.toString();
  }

  return id;
};

const isObjectWithKeys = (obj) => typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).length > 0;

/**
 * Get a diff between <b>previousObject</b> and <b>newObject</b>
 * @param previousObject {object} The original object to compare.
 * @param newObject {object} The new object to compare.
 * @param [excludedKeys] {string[]} A string array with keys to exclude from the diff.
 * @returns {{}} An object with keys that differs and their old and new values.
 */
const getDiff = (previousObject, newObject, excludedKeys = []) => {
  const diff = {};
  for (const key of Object.keys(newObject)) {
    if (excludedKeys.includes(key)) {
      continue;
    }

    if (JSON.stringify(newObject[key]) === JSON.stringify(previousObject[key])) {
      continue;
    }

    if (isObjectWithKeys(previousObject[key]) && isObjectWithKeys(newObject[key]) && previousObject[key]._id && newObject[key]._id) {
      const previousId = getObjectIdValue(previousObject[key]._id);
      const newId = getObjectIdValue(newObject[key]._id);

      if (previousId === newId) {
        if (previousObject[key].data && newObject[key].data && JSON.stringify(previousObject[key].data) === JSON.stringify(newObject[key].data)) {
          // NOTE: Diff key has same _id in both previous and new object and the same data. Unchanged
          continue;
        }

        // NOTE: Diff key has same _id in both previous and new object but different data. Changed
      }
    }

    diff[key] = { from: previousObject[key], to: newObject[key] };
  }

  return diff;
};

module.exports = {
  getDiff
};
