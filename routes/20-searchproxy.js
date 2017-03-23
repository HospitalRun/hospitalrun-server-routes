var forward = require('../forward.js');
var request = require('request');
var url = require('url');

function _createMapFunction(type, query) {
  var mapFunction = 'function(doc) {' +
      'var found_doc = false,' +
      '   doctype, ' +
      '   queryValue, ' +
      '   uidx;' +
      'if (doc._id && (uidx = doc._id.indexOf("_")) > 0) {' +
          'doctype = doc._id.substring(0, uidx);' +
          'if(doctype === "' + type + '") {';
  var printedQueryValue = false;
  query.forEach(function(query) {
    var queryParts = query.split(':');
    if (queryParts.length === 2) {
      var key = queryParts[0];
      var value = queryParts[1];
      var lastChar = (value.length - 1);
      if (!printedQueryValue) {
        // Remove fuzzy and wildcard for slow search
        if (value.substr(lastChar) === '~') {
          value = value.substr(0, lastChar);
        } else if (value.substr(0,1) === '*' && value.substr(lastChar) === '*') {
          value = value.substr(1, (lastChar - 1));
        }
        mapFunction += 'queryValue = "' + value.toLowerCase() + '";';
        printedQueryValue = true;
      }
      mapFunction += 'if (doc.' + key + ' && doc.' + key + '.toLowerCase().indexOf(queryValue) >= 0) {' +
          'found_doc = true;' +
      '}';
    }
  });
  mapFunction += 'if (found_doc === true) {' +
      'emit(doc._id, null);' +
  '}' +
'}' +
'}' +
'}';
  return {
    map: mapFunction
  };
}

function slowSearch(pattern, dburl) {
  return function(req, res) {
    var model = req.url.match(pattern)[1];
    var parsedURL = url.parse(req.url, true);
    var searchUrl = dburl + '/main/_temp_view/?include_docs=true';
    var query = parsedURL.query.q;
    var queryParts = query.split(' OR ');
    var size =  parsedURL.query.size;
    if (size) {
      searchUrl += '&limit='+size;
    }
    var requestOptions = {
      body: _createMapFunction(model, queryParts),
      json: true,
      url: searchUrl,
      headers: {
        Cookie: req.get('Cookie')
      }
    };
    request.post(requestOptions).pipe(res);
  };
}

module.exports = function(app, config) {
  var searchPath = '/search/';
  if (config.searchURL) {
    app.use(searchPath, forward(config.searchURL, config));
  } else {
    app.use(searchPath, slowSearch(/\/hrdb\/(.*)\/_search\?q=(.*)/, config.couchAuthDbURL));
  }
};
