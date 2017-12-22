const generateKey = require('../lib/generateKey.js');

module.exports = function(server, api, config) {
  const cache = config.pageCache ? Object.assign({}, config.pageCache) : undefined;
  server.method('pagedata.getPage', async(slug, query) => {
    if (!query) {
      query = {};
    }
    const start = new Date().getTime();
    // let caller override status or just set to default config:
    if (!query.status) {
      query.status = config.status;
    }
    const page = await api.getPage(slug, query);
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { page: slug, query, responseTime: end - start });
    }
    return page;
  }, {
    generateKey,
    cache
  });
};
