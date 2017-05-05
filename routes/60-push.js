function returnError(message, code, res) {
  res.status(code);
  res.send(JSON.stringify({
    error: message
  }));
}


module.exports = function(app, config) {
  const nano = require('nano')(config.couchAuthDbURL);
  nano.db.get('pushinfo', function(err) {
    if (err) {
      nano.db.create('pushinfo', function(err) {
        if (err) {
          console.log('Error creating push database!', err);
        } else {
          let pushDB = nano.use('pushinfo');
          pushDB.insert({
            admins: {
              roles: ['_admin']
            },
            members: {
              roles: ['_admin']
            }
          }, '_security', function(err) {
            if (err) {
              console.log('Error setting security on push database', JSON.stringify(err, null, 2));
            }
          });
        }
      });
    }
  });

  app.post('/save-subscription/', function (req, res) {
    let pushDB = nano.use('pushinfo');
    res.setHeader('Content-Type', 'application/json');
    if (!req.body || !req.body.subscription.endpoint) {
      returnError('Bad subscription', 400, res);
    } else {
      let subInfo = req.body;
      pushDB.insert(subInfo, function(err, body) {
        if (err) {
          returnError('Unable to save subscription', 500, res);
        } else {
          res.send(JSON.stringify(body));
        }
      });
    }
  });

  app.post('/update-subscription/', function (req, res) {
    let pushDB = nano.use('pushinfo');
    res.setHeader('Content-Type', 'application/json');
    if (!req.body || !req.body.remoteSeq || !req.body.subscriptionId) {
      returnError('Invalid request: '+ JSON.stringify(req.body, null, 2), 400, res);
    } else {
      pushDB.get(req.body.subscriptionId, function(err, subscription) {
        if (err) {
          returnError('Invalid request', 400, res);
        } else {
          if (subscription.dbInfo.remoteSeq < req.body.remoteSeq) {
            subscription.dbInfo.remoteSeq = req.body.remoteSeq;
            pushDB.insert(subscription, function(err, saveResponse) {
              if (err) {
                returnError('Unable to update subscription', 500, res);
              } else {
                res.send(JSON.stringify(saveResponse));
              }
            });
          } else {
            res.send({ok:true});
          }
        }
      });
    }
  });
};
