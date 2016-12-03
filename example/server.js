/* eslint-disable no-console */
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
    host: `http://localhost:${port}`,
    key: 'key',
    cacheEndpoint: '/cache',
    hookEndpoint: '/hook',
    //globalSlugs: ['global'],
    verbose: true,
    site: 'site',
    tag: 'test'
  }
}, (err) => {
  if (err) {
    throw err;
  }

  server.method('test', (cb) => {
    setTimeout(() => {
      cb(null, { pre: true });
    }, 500);
  });

  //mock pagedata
  server.route({
    path: '/api/sites/{site}/pages/{page}',
    method: 'GET',
    handler(request, reply) {
      reply({
        content: {
          site: request.params.site,
          page: request.params.page
        }
      });
    }
  });

  server.route({
    path: '/',
    method: 'GET',
    config: {
      pre: [
        { method: 'test()', assign: 'test' }
      ],
      plugins: {
        'hapi-pagedata': {
          pages: ['test', 'test-2']
        }
      }
    },
    handler(request, reply) {
      reply(request.pre);
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

