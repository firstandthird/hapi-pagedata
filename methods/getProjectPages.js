const generateKey = require('../lib/generateKey.js');

module.exports = function(server, api, config) {
  const cache = config.projectPagesCache ? Object.assign({}, config.projectPagesCache) : undefined;

  server.method('pagedata.getProjectPages', (projectSlug, query) => {
    if (!query) {
      query = {};
    }
    const start = new Date().getTime();
    query.projectSlug = projectSlug;
    if (!query.status) {
      query.status = config.status;
    }
    return new Promise((resolve, reject) => {
      api.getPages(query, (err, pages) => {
        if (err) {
          if (config.verbose) {
            server.log(['pagedata', 'getProjectPages', 'error', projectSlug], err);
          }
          return reject(err);
        }
        if (config.verbose) {
          const end = new Date().getTime();
          server.log(['pagedata', 'fetch'], { projectSlug, status: query.status, responseTime: end - start });
        }
        resolve(pages);
      });
    });
  }, {
    generateKey,
    cache
  });
};
