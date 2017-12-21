module.exports = function(server, api, config) {
  server.method('pagedata.getPageContent', async(slug, query) => {
    if (!query) {
      query = {};
    }
    const page = await server.methods.pagedata.getPage(slug, query);
    return page.content;
  });
};
