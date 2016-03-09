
module.exports = function(app, config) {
  if (config.newrelic) {
    var interceptor = require('express-interceptor');
    app.use(/^\/$/,interceptor(function() {
      return {
        isInterceptable: function() {
          return true;
        },
        intercept: function(body, send) {
          var title = '</title>';
          var newTitle = title + config.newrelic.getBrowserTimingHeader();
          var newBody = body.replace(title, newTitle);
          send(newBody);
        }
      };
    }));
  }
};
