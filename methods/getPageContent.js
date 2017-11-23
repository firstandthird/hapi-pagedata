module.exports = function(server, api, config) {
  server.method('pagedata.getPageContent', (slug, query) => {
    if (!query) {
      query = {};
    }
    server.methods.pagedata.getPage(slug, query, (err, page) => {
      if (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(null, page.content);
    });
  });
};
