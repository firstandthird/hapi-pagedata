'use strict';
module.exports = function(obj, done) {
  const server = this.server;
  const config = this.config;
  const api = this.api;
  const tag = obj.tag || config.tag;

  const start = new Date().getTime();

  api.getPage(obj.id, tag, (err, payload) => {
    if (err) {
      if (config.verbose) {
        server.log(['pagedata', 'error'], { site: obj.site, page: obj.id, error: err.message || err.toString() });
      }
      return done(err);
    }
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { site: obj.site, page: obj.id, responseTime: end - start });
    }
    return done(null, payload);
  });
};
