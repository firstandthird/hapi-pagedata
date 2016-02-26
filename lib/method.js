const wreck = require('wreck');
module.exports = function(id, done) {
  if (!id) {
    return done(null, {});
  }

  const server = this.server;
  const config = this.config;
  const url = `${config.host}/${config.env}/api/page/${id}?json=1`;
  const start = new Date().getTime();
  wreck.get(url, {
    json: true,
    headers: {
      'x-api-key': config.key
    }
  }, (err, res, payload) => {
    if (err) {
      return done(err);
    }
    if (payload.errorMessage) {
      server.log(['pagedata', 'error'], { page: id, message: payload.errorMessage });
      return done(new Error(payload.errorMessage));
    }
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { page: id, responseTime: end - start });
    }
    return done(null, payload.content);
  });
};
