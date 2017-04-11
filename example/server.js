/* eslint-disable no-console */
'use strict';
const Hapi = require('hapi');
const port = process.env.PORT || 8080;

const server = new Hapi.Server({
  debug: {
    log: ['pagedata', 'error', 'cache'],
    request: ['error']
  }
});
server.connection({ port });

server.register({
  register: require('../'),
  options: {
    host: process.env.PAGEDATA_HOST || `http://localhost:${port}`,
    key: process.env.PAGEDDATA_KEY || 'key',
    enableCache: process.env.PAGEDATA_CACHE || true,
    //enablePagesCache: true,
    //cachePagesWithContent: true,
    cacheEndpoint: '/cache',
    hookEndpoint: '/hook',
    verbose: true,
    //tag: 'prod'
  }
}, (err) => {
  if (err) {
    throw err;
  }

  //mock pagedata
  server.route({
    path: '/api/pages/{page}',
    method: 'GET',
    handler(request, reply) {
      reply({
        content: {
          page: request.params.page
        }
      });
    }
  });

  server.route({
    path: '/pages/{slug}',
    method: 'GET',
    config: {
      pre: [
        { method: 'pagedata.getPage(params.slug)', assign: 'data' }
      ]
    },
    handler(request, reply) {
      reply(request.pre);
    }
  });

  server.route({
    path: '/pages/{slug}/content',
    method: 'GET',
    config: {
      pre: [
        { method: 'pagedata.getPageContent(params.slug)', assign: 'data' }
      ]
    },
    handler(request, reply) {
      reply(request.pre);
    }
  });

  server.route({
    path: '/pages',
    method: 'GET',
    config: {
      pre: [
        { method: 'pagedata.getPages(query)', assign: 'data' }
      ]
    },
    handler(request, reply) {
      reply(request.pre);
    }
  });

  server.route({
    path: '/sites',
    method: 'GET',
    handler(request, reply) {
      request.server.plugins['hapi-pagedata'].api.getSites(reply);
    }
  });

  server.route({
    path: '/sites/{site}',
    method: 'GET',
    handler(request, reply) {
      const query = {
        siteSlug: request.params.site
      };
      if (request.query.collection) {
        query.collection = request.query.collection;
      }
      request.server.plugins['hapi-pagedata'].api.getPages(query, reply);
    }
  });

  server.route({
    path: '/sites/{site}/collections',
    method: 'GET',
    handler(request, reply) {
      request.server.plugins['hapi-pagedata'].api.getCollections({ siteSlug: request.params.site }, reply);
    }
  });

  server.start((serverErr) => {
    if (serverErr) {
      throw serverErr;
    }
    //server.methods.pageData.set('test-1', { blah: true });
    console.log('Server started', server.info.uri);
  });
});

