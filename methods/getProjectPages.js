module.exports = function(server, api, config) {
  let cache = undefined;
  if (config.enableProjectPagesCache) {
    cache = Object.assign({}, config.cache);
  }

  server.method('pagedata.getProjectPages', (projectSlug, done) => {
    const start = new Date().getTime();
    const query = {
      projectSlug,
      status: config.status
    };
    api.getPages(query, (err, pages) => {
      if (err) {
        if (config.verbose) {
          server.log(['pagedata', 'getProjectPages', 'error', projectSlug], err);
        }
        return done(err);
      }
      if (config.verbose) {
        const end = new Date().getTime();
        server.log(['pagedata', 'fetch'], { projectSlug, status: config.status, responseTime: end - start });
      }
      done(null, pages);
    });
  }, {
    cache
  });
};