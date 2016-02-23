var globSync   = require('glob').sync;
var routes = globSync('./routes/**/*.js', { cwd: __dirname }).map(require);
module.exports = function(app, config) {
  routes.forEach(function(route) {
    route(app, config);
  });
};
