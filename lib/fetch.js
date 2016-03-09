module.exports = function(id, done) {
  const server = this.server;
  const config = this.config;
  const pageData = this.pageData;

  const start = new Date().getTime();

  pageData.get(id.id, (err, payload) => {
    if (err) {
      server.log(['pagedata', 'error'], { page: id, error: err });
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
