const generateKey = require('../lib/generateKey.js');
const util = require('util');
module.exports = function(server, api, config) {
  const cache = config.pageCache ? Object.assign({}, config.pageCache) : undefined;
  server.method('pagedata.getPage', (slug, query) => {
    if (!query) {
      query = {};
    }
    const start = new Date().getTime();
    // let caller override status or just set to default config:
    if (!query.status) {
      query.status = config.status;
    }
    return new Promise((resolve, reject) => {
      api.getPage(slug, query, (err, page) => {
        if (err) {
          if (config.verbose) {
            server.log(['pagedata', 'getPage', 'error', slug], err);
          }
          return reject(err);
        }
        if (config.verbose) {
          const end = new Date().getTime();
          server.log(['pagedata', 'fetch'], { page: slug, query, responseTime: end - start });
        }
        resolve(page);
      });
    });
  }, {
    generateKey,
    cache
  });
};
