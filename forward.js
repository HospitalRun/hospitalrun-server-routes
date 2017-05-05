var onHeaders = require('on-headers');
var request = require('request');

module.exports = function(host, config, useOauth) {
  return function(req, res) {
    var forwardURL = host + req.url;
    var requestOptions = {
      url: forwardURL
    };
    var reqMethod = req.method.toLowerCase();
    if (reqMethod === 'delete') {
      reqMethod = 'del';
    }
    if (useOauth) {
      if (req.get('x-oauth-consumer-key')) {
        requestOptions.oauth = {
          consumer_key: req.get('x-oauth-consumer-key'),
          consumer_secret: req.get('x-oauth-consumer-secret'),
          token: req.get('x-oauth-token'),
          token_secret: req.get('x-oauth-token-secret')
        };
      }
    }

    if (config.emberCLI) {
      // Ember CLI uses compression (https://www.npmjs.com/package/compression) which
      // causes issues when proxying requests, so turn off compression for proxied requests.
      onHeaders(res, function() {
        res.header('Cache-Control','no-transform');
      });
    }
    req.pipe(request[reqMethod](requestOptions).on('error', function(err) {
      console.log('Got error forwarding: ', err);
    })).pipe(res);
  };
};
