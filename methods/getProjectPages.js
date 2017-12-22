const generateKey = require('../lib/generateKey.js');

module.exports = function(server, api, config) {
  const cache = config.projectPagesCache ? Object.assign({}, config.projectPagesCache) : undefined;

  server.method('pagedata.getProjectPages', async(projectSlug, query) => {
    if (!query) {
      query = {};
    }
    const start = new Date().getTime();
    query.projectSlug = projectSlug;
    if (!query.status) {
      query.status = config.status;
    }
    const pages = await api.getPages(query);
    if (config.verbose) {
      const end = new Date().getTime();
      server.log(['pagedata', 'fetch'], { projectSlug, status: query.status, responseTime: end - start });
    }
    return pages;
  }, {
    generateKey,
    cache
  });
};
