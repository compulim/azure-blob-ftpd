'use strict';

const deepAssign = require('deep-assign');

const { node_env: nodeEnv } = process.env;

const favor = (/^production$/i.exec(nodeEnv) || ['development'])[0];

const
  defaults = require('./config/config.default'),
  overrides = require('./config/config.env');

function config(favor) {
  return deepAssign(
    {},
    defaults,
    require(`./config/config.${ favor }`)
  );
}

module.exports = deepAssign(
  config,
  defaults,
  config(favor),
  overrides
);
