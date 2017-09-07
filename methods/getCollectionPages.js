const generateKey = require('../lib/generateKey.js');

module.exports = function(server, api, config) {
  const cache = config.collectionPagesCache ? Object.assign({}, config.collectionPagesCache) : undefined;

  server.method('pagedata.getCollectionPages', (parentPageSlug, query, done) => {
    if (typeof query === 'function') {
      done = query;
      query = {};
    }
    const start = new Date().getTime();
    query.parentPageSlug = parentPageSlug;
    if (!query.status) {
      query.status = config.status;
    }
    // parentPageSlug,
    api.getPages(query, (err, pages) => {
      if (err) {
        if (config.verbose) {
          server.log(['pagedata', 'getCollectionPages', 'error', parentPageSlug], err);
        }
        return done(err);
      }
      if (config.verbose) {
        const end = new Date().getTime();
        server.log(['pagedata', 'fetch'], { parentPageSlug, status: query.status, responseTime: end - start });
      }
      done(null, pages);
    });
  }, {
    generateKey,
    cache
  });
};
