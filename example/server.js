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
    key: process.env.PAGEDATA_KEY || 'key',
    status: 'draft',
    pageCache: { expiresIn: 60 * 1000, staleIn: 5000, staleTimeout: 200, generateTimeout: 5000 },
    projectPagesCache: { expiresIn: 60 * 1000, staleIn: 5000, staleTimeout: 200, generateTimeout: 5000 },
    parentPagesCache: { expiresIn: 60 * 1000, staleIn: 5000, staleTimeout: 200, generateTimeout: 5000 },
    verbose: true
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
        { method: "pagedata.getPage(params.slug)", assign: 'data' }
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
    path: '/pages/{slug}/children',
    method: 'GET',
    config: {
      pre: [
        { method: 'pagedata.getCollectionPages(params.slug)', assign: 'data' }
      ]
    },
    handler(request, reply) {
      reply(request.pre);
    }
  });

  server.route({
    path: '/projects',
    method: 'GET',
    handler(request, reply) {
      request.server.plugins['hapi-pagedata'].api.getProjects(reply);
    }
  });

  server.route({
    path: '/projects/{project}',
    method: 'GET',
    config: {
      pre: [
        { method: 'pagedata.getProjectPages(params.project)', assign: 'data' }
      ]
    },
    handler(request, reply) {
      reply(request.pre);
    }
  });

  server.route({
    path: '/projects/{project}/collections',
    method: 'GET',
    handler(request, reply) {
      request.server.plugins['hapi-pagedata'].api.getCollectionPages(request.params.project, { limit: 10 }, reply);
    }
  });

  server.start((serverErr) => {
    if (serverErr) {
      throw serverErr;
    }
    console.log('Server started', server.info.uri);
  });
});
