'use strict';
module.exports = function(slug, tag, done) {
  const server = this.server;
  const config = this.config;
  const api = this.api;
  if (typeof tag === 'function') {
    done = tag;
    tag = '';
  }
  tag = tag || config.tag;


  const start = new Date().getTime();

  api.getPage(slug, tag, (err, payload) => {
    if (err) {
      server.log(['pagedata', 'error'], { page: slug, tag, error: err.message || err.toString() });
      return done(err);
    }
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { page: slug, tag, responseTime: end - start });
    }
    return done(null, payload);
  });
};
