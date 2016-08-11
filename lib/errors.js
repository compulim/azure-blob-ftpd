'use strict';

const
  ERR_ACCESS_DENIED = new Error('permission denied');

ERR_ACCESS_DENIED.code = 'EACCES';

module.exports = {
  ERR_ACCESS_DENIED
};
