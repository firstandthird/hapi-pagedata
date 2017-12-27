/* eslint-disable no-console */
'use strict';
const Hapi = require('hapi');
const port = process.env.PORT || 8080;

const f = async() => {
  const server = new Hapi.Server({
    debug: {
      log: ['pagedata', 'error', 'cache'],
      request: ['error']
    },
    port
  });

  try {
    server.register({
      plugin: require('../'),
      options: {
        host: process.env.PAGEDATA_HOST || `http://localhost:${port}`,
        key: process.env.PAGEDATA_KEY || 'key'
      }
    });
  } catch (e) {
    console.log(e);
    return;
  }

  // will return the draft version of the page with the indicated slug:
  server.route({
    path: '/page/{slug}',
    method: 'GET',
    handler(request, h) {
      return request.server.api.getPage(request.params.slug);
    }
  });

  // will return a list of projects:
  server.route({
    path: '/projects',
    method: 'GET',
    handler(request, h) {
      return request.server.api.getProjects();
    }
  });

  // will return all published pages:
  server.route({
    path: '/publishedPages',
    method: 'GET',
    handler(request, h) {
      return request.server.api.getPages({ status: 'published' });
    }
  });
  await server.start();
  console.log('Server started', server.info.uri);
};

f();
