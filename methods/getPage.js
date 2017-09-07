const generateKey = require('../lib/generateKey.js');

module.exports = function(server, api, config) {
  const cache = config.pageCache ? Object.assign({}, config.pageCache) : undefined;
  server.method('pagedata.getPage', (slug, query, done) => {
    const start = new Date().getTime();
    // let caller override status or just set to default config:
    if (!query.status) {
      query.status = config.status;
    }
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
    generateKey,
    cache
  });
};
