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
    port: 9090
  });
  try {
    await mockServer.start();
  } catch (e) {
    console.log(e);
  }
});

lab.afterEach(async () => {
  await server.stop();
  await mockServer.stop();
});

lab.test('getPage', () => {
  return new Promise((resolve, reject) => {
    async.autoInject({
      async register() {
        mockServer.route({
          method: 'get',
          path: '/api/pages/my-page',
          handler(request, h) {
            // expect(request.query.status).to.equal('published');
            return 'hi there';//"{ slug: 'my-page', content: { status: 'hungry' } }";
          }
        });
        await server.register({
          plugin: require('../'),
          options: {
            host: 'http://localhost:9090',
            key: 'key',
            cacheEndpoint: '/cache',
            verbose: true,
          }
        });
        try {
          await server.start();
        } catch (e) {
          console.log(e)
        }
      },
      async call(register) {
        const response = await mockServer.inject({
          method: 'get',
          url: '/api/pages/my-page'
        })
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
      async register() {
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
      async call(register) {
        return await server.methods.pagedata.getPageContent('my-page', { status: 'published' });
      },
      async verify(call) {
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

lab.test('getProjectPages', () => {
  return new Promise((resolve, reject) => {
    async.autoInject({
      async register() {
        mockServer.route({
          method: 'get',
          path: '/api/pages',
          handler(request, reply) {
            expect(request.query.status).to.equal('published');
            expect(request.query.projectSlug).to.equal('my-project');
            return [
              { slug: 'page 1', content: { status: 'hungry' } },
              { slug: 'page 2', content: { status: 'fed' } }
            ];
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
      async call(register) {
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

lab.test('getCollectionPages', () => {
  return new Promise((resolve, reject) => {
    async.autoInject({
      async register() {
        mockServer.route({
          method: 'get',
          path: '/api/pages',
          handler(request, reply) {
            expect(request.query.status).to.equal('published');
            expect(request.query.parentPageSlug).to.equal('my-collection');
            return [
              { slug: 'page 1', content: { status: 'hungry' } },
              { slug: 'page 2', content: { status: 'fed' } }
            ];
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
      async call(register) {
        return await server.methods.pagedata.getCollectionPages('my-collection', { populate: 'content' });
      },
      async verify(call) {
        expect(call[0].content.status).to.equal('hungry');
        expect(call[1].content.status).to.equal('fed');
      }
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
});

lab.test('getPage --cache', allDone => {
  return new Promise((resolve, reject) => {
    let status = 'hungry';
    async.autoInject({
      async register() {
        mockServer.route({
          method: 'get',
          path: '/api/pages/my-page',
          handler(request, reply) {
            expect(request.query.status).to.equal('published');
            return [{ slug: 'my-page', content: { status } }];
          }
        });
        await server.register({
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
        });
        await server.start();
      },
      async call() {
        return await server.methods.pagedata.getPage('my-page', { status: 'published' });
      },
      async cacheCall(call) {
        status = 'fed';
        return await server.methods.pagedata.getPage('my-page', { status: 'published' });
      },
      async verify(call, cacheCall) {
        // cached value will not be updated:
        expect(call[0].content.status).to.equal(cacheCall[0].content.status);
      }
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
});
