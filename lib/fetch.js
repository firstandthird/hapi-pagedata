module.exports = function(obj, done) {
  const server = this.server;
  const config = this.config;
  const pageData = this.pageData;
  const tag = obj.tag || config.tag;

  const start = new Date().getTime();

  pageData.get(obj.site, obj.id, tag, (err, payload) => {
    if (err) {
      if (config.verbose) {
        server.log(['pagedata', 'error'], { site: obj.site, page: obj.id, error: err.message || err.toString() });
      }
      return done(err);
    }
    if (payload.errorMessage) {
      if (config.verbose) {
        server.log(['pagedata', 'error'], { site: obj.site, page: obj.id, message: payload.errorMessage });
      }
      return done(new Error(payload.errorMessage));
    }
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { site: obj.site, page: obj.id, responseTime: end - start });
    }
    return done(null, payload.content);
  });
};
