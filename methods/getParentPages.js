module.exports = function(server, api, config) {
  let cache = undefined;
  if (config.enableParentPagesCache) {
    cache = Object.assign({}, config.cache);
  }

  server.method('pagedata.getParentPages', (parentPageSlug, done) => {
    const start = new Date().getTime();
    const query = {
      parentPageSlug,
      status: config.status
    };
    api.getPages(query, (err, pages) => {
      if (err) {
        if (config.verbose) {
          server.log(['pagedata', 'getParentPages', 'error', parentPageSlug], err);
        }
        return done(err);
      }
      if (config.verbose) {
        const end = new Date().getTime();
        server.log(['pagedata', 'fetch'], { parentPageSlug, status: config.status, responseTime: end - start });
      }
      done(null, pages);
    });
  }, {
    cache
  });
};
