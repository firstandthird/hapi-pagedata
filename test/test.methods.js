/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');
const async = require('async');

let server;
let mockServer;

lab.beforeEach(async () => {
  server = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] },
    port: 8081
  });
  mockServer = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] },
    port: 8080
  });
  await mockServer.start();
});

lab.afterEach(async () => {
  await server.stop();
  await mockServer.stop();
});

lab.test('getPage', () => {
  return new Promise((resolve, reject) => {
    async.autoInject({
      register: async function() {
        mockServer.route({
          method: 'get',
          path: '/api/pages/my-page',
          handler(request, h) {
            expect(request.query.status).to.equal('published');
            return { slug: 'my-page', content: { status: 'hungry' } };
          }
        });
        await server.register({
          plugin: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            verbose: true,
          }
        });
        await server.start();
      },
      call: async(register) => {
        const r = await server.methods.pagedata.getPage('my-page', { status: 'published' });
        return r;
      },
      verify(call, done) {
        expect(typeof call.content).to.equal('object');
        expect(call.content.status).to.equal('hungry');
        expect(call.slug).to.equal('my-page');
        done();
      }
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
});

lab.test('getPageContent', () => {
  return new Promise((resolve, reject) => {
    async.autoInject({
      register: async() => {
        mockServer.route({
          method: 'get',
          path: '/api/pages/my-page',
          handler(request, h) {
            expect(request.query.status).to.equal('published');
            return { slug: 'my-page', content: { status: 'hungry' } };
          }
        });
        await server.register({
          plugin: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            verbose: true,
          }
        });
        await server.start();
      },
      call: async(register) => {
        return await server.methods.pagedata.getPageContent('my-page', { status: 'published' });
      },
      verify: async(call) => {
        expect(typeof call).to.equal('object');
        expect(call.status).to.equal('hungry');
      }
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
});
/*

lab.test('getProjectPages', () => {
  return new Promise((resolve, reject) => {
    async.autoInject({
      register: async() => {
        mockServer.route({
          method: 'get',
          path: '/api/pages',
          handler(request, reply) {
            expect(request.query.status).to.equal('published');
            expect(request.query.projectSlug).to.equal('my-project');
            return reply(null, [
              { slug: 'page 1', content: { status: 'hungry' } },
              { slug: 'page 2', content: { status: 'fed' } }
            ]);
          }
        });
        await server.register({
          plugin: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            verbose: true,
          }
        });
        await server.start();
      },
      call: async(register) => {
        return await server.methods.pagedata.getProjectPages('my-project', { populate: 'content' });
      },
      verify(call, done) {
        expect(call[0].content.status).to.equal('hungry');
        expect(call[1].content.status).to.equal('fed');
        done();
      }
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
});

lab.test('getCollectionPages', allDone => {
  async.autoInject({
    register: async() => {
      mockServer.route({
        method: 'get',
        path: '/api/pages',
        handler(request, reply) {
          expect(request.query.status).to.equal('published');
          expect(request.query.parentPageSlug).to.equal('my-collection');
          return reply(null, [
            { slug: 'page 1', content: { status: 'hungry' } },
            { slug: 'page 2', content: { status: 'fed' } }
          ]);
        }
      });
      server.register({
        plugin: require('../'),
        options: {
          host: 'http://localhost:8080',
          key: 'key',
          cacheEndpoint: '/cache',
          verbose: true,
        }
      }, done);
    },
    start(register, done) {
      server.start(done);
    },
    call(start, done) {
      server.methods.pagedata.getCollectionPages('my-collection', { populate: 'content' }, done);
    },
    verify(call, done) {
      expect(call[0].content.status).to.equal('hungry');
      expect(call[1].content.status).to.equal('fed');
      done();
    }
  }, allDone);
});

lab.test('getPage --cache', allDone => {
  let status = 'hungry';
  async.autoInject({
    register: async() => {
      mockServer.route({
        method: 'get',
        path: '/api/pages/my-page',
        handler(request, reply) {
          expect(request.query.status).to.equal('published');
          return reply(null, { slug: 'my-page', content: { status } });
        }
      });
      server.register({
        plugin: require('../'),
        options: {
          host: 'http://localhost:8080',
          key: 'key',
          cacheEndpoint: '/cache',
          verbose: true,
          pageCache: {
            expiresIn: 1000 * 60 * 60 * 24 * 7, //1 week
            staleIn: 1000 * 60 * 60 * 23, //23 hours
            staleTimeout: 200,
            generateTimeout: 5000
          }
        }
      }, done);
    },
    start(register, done) {
      server.start(done);
    },
    call(start, done) {
      server.methods.pagedata.getPage('my-page', { status: 'published' }, done);
    },
    cacheCall(call, done) {
      status = 'fed';
      server.methods.pagedata.getPage('my-page', { status: 'published' }, done);
    },
    verify(call, cacheCall, done) {
      // cached value will not be updated:
      expect(call[0].content.status).to.equal(cacheCall[0].content.status);
      done();
    }
  }, allDone);
});
*/
