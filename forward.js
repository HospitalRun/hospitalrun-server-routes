var onHeaders = require('on-headers');
var request = require('request');

module.exports = function(host, config) {
  return function(req, res) {
    var forwardURL = host + req.url;
    var reqMethod = req.method.toLowerCase();
    if (reqMethod == 'delete') {
      reqMethod = 'del';
    }
    if (config.emberCLI) {
      // Ember CLI uses compression (https://www.npmjs.com/package/compression) which
      // causes issues when proxying requests, so turn off compression for proxied requests.
      onHeaders(res, function() {
        res.header('Cache-Control','no-transform');
      });
    }
    req.pipe(request[reqMethod](forwardURL).on('error', function(err) {
      console.log('Got error forwarding: ', err);
    })).pipe(res);
  };
};
