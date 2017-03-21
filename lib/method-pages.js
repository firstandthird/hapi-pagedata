'use strict';
module.exports = function(siteSlug, collectionId, done) {
  const server = this.server;
  const config = this.config;
  const api = this.api;

  const start = new Date().getTime();

  api.getPagesWithContent(siteSlug, collectionId, (err, payload) => {
    if (err) {
      if (config.verbose) {
        server.log(['pagedata', 'error'], { endpoint: 'getPages', siteSlug, collectionId, error: err.message || err.toString() });
      }
      return done(err);
    }
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { endpoint: 'getPages', siteSlug, collectionId, responseTime: end - start });
    }
    return done(null, payload);
  });
};
