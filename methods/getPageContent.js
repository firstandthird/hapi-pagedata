module.exports = function(server, api, config) {
  server.method('pagedata.getPageContent', (slug, query, done) => {
    server.methods.pagedata.getPage(slug, query, (err, page) => {
      if (err) {
        return done(err);
      }
      return done(null, page.content);
    });
  });
};
