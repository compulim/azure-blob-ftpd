'use strict';

const config = require('./config');

const
  AzureStorageFS = require('azure-storage-fs'),
  debug = require('debug')('ftpd'),
  ftpd = require('ftpd'),
  promisifyObject = require('./util/promisifyObject'),
  { ERR_ACCESS_DENIED } = require('./errors');

const
  server = new ftpd.FtpServer(config.HOST, {
    getInitialCwd: () => '/',
    getRoot: () => '/'
  });

const blobService = promisifyObject(
  require('azure-storage').createBlobService(config.BLOB_ACCOUNT_NAME, config.BLOB_SECRET),
  [
    'doesContainerExist',
    'getContainerMetadata'
  ]
);

server.on('client:connected', connection => {
  connection.on('command:user', (username, success, failure) => {
    debug(`user "${ username }" is connected`);

    blobService.doesContainerExist(username, {})
      .delay(config.CREDENTIAL_CHECK_PAUSE)
      .then(result => !result.exists && Promise.reject(ERR_ACCESS_DENIED))
      .then(() => {
        connection.username = username;
        success();
      }, err => {
        failure(err);
      });
  });

  connection.on('command:pass', (actualPassword, success, failure) => {
    debug(`checking password for user "${ connection.username }"`);

    blobService.getContainerMetadata(connection.username, {})
      .delay(config.CREDENTIAL_CHECK_PAUSE)
      .then(result => {
        const expectedPassword = decodeURIComponent(result.metadata[config.CONTAINER_PASSWORD_METADATA_NAME]);

        if (actualPassword !== expectedPassword) {
          return Promise.reject(ERR_ACCESS_DENIED);
        }
      })
      .then(
        () => {
          success(
            connection.username,
            AzureStorageFS.blob(
              config.BLOB_ACCOUNT_NAME,
              config.BLOB_SECRET,
              connection.username
            )
          );
        },
        err => failure(err)
      );
  });
});

server.listen(config.PORT);
