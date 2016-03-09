
module.exports = function(app, config) {
  if (config.serverInfo) {
    app.get('/serverinfo', function(req, res) {
      res.json(config.serverInfo);
    });
  }
};
