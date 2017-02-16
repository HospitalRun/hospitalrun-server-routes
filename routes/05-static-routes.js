var express = require('express');

module.exports = function(app, config) {
  app.use('/patientimages', express.static(config.imagesdir));
  app.use('/attachments', express.static(config.attachmentsDir));
};
