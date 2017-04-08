'use strict';
module.exports = function(query, done) {
  if (typeof query === 'function') {
    done = query;
    query = {};
  }
  const server = this.server;
  const config = this.config;
  const api = this.api;

  const start = new Date().getTime();

  api.getPages(query, (err, payload) => {
    if (err) {
      if (config.verbose) {
        server.log(['pagedata', 'error'], { endpoint: 'getPages', query, error: err.message || err.toString() });
      }
      return done(err);
    }
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { endpoint: 'getPages', query, responseTime: end - start });
    }
    return done(null, payload);
  });
};
