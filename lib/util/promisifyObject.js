'use strict';

const Promise = require('bluebird');

const { promisify } = Promise;

function promisifyObject(target, functionNames = Object.keys(target)) {
  return functionNames.reduce((promised, name) => {
    promised[name] = promisify(target[name], { context: target });

    return promised;
  }, {});
};

module.exports = promisifyObject;
