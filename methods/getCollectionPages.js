const generateKey = require('../lib/generateKey.js');

module.exports = function(server, api, config) {
  const cache = config.collectionPagesCache ? Object.assign({}, config.collectionPagesCache) : undefined;

  server.method('pagedata.getCollectionPages', async(parentPageSlug, query) => {
    if (!query) {
      query = {};
    }
    const start = new Date().getTime();
    query.parentPageSlug = parentPageSlug;
    if (!query.status) {
      query.status = config.status;
    }
    // parentPageSlug,
    const pages = await api.getPages(query);
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { parentPageSlug, status: query.status, responseTime: end - start });
    }
    return pages;
  }, {
    generateKey,
    cache
  });
};
