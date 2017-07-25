module.exports = function(server, api, config) {
  let cache = undefined;
  if (config.enablePageCache) {
    cache = Object.assign({}, config.cache);
  }

  server.method('pagedata.getPage', (slug, done) => {
    const start = new Date().getTime();
    const query = {
      status: config.status,
      populate: config.populatePage
    };
    api.getPage(slug, query, (err, page) => {
      if (err) {
        if (config.verbose) {
          server.log(['pagedata', 'getPage', 'error', slug], err);
        }
        return done(err);
      }
      if (config.verbose) {
        const end = new Date().getTime();
        server.log(['pagedata', 'fetch'], { page: slug, query, responseTime: end - start });
      }
      done(null, page);
    });
  }, {
    cache
  });
};
