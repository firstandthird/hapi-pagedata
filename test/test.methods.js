/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');
const async = require('async');
let server;
let mockServer;

lab.beforeEach(done => {
  server = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] }
  });
  server.connection({ port: 8080 });
  mockServer = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] }
  });
  mockServer.connection({ port: 8080 });
  mockServer.start(done);
});

lab.afterEach((done) => {
  server.stop(() => {
    mockServer.stop(done);
  });
});

lab.test('getPage', allDone => {
  async.autoInject({
    register(done) {
      mockServer.route({
        method: 'get',
        path: '/api/pages/my-page',
        handler(request, reply) {
          expect(request.query.status).to.equal('published');
          return reply(null, { slug: 'my-page', content: { status: 'hungry' } });
        }
      });
      server.register({
        register: require('../'),
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
      server.methods.pagedata.getPage('my-page', { status: 'published' }, done);
    },
    verify(call, done) {
      expect(typeof call.content).to.equal('object');
      expect(call.content.status).to.equal('hungry');
      expect(call.slug).to.equal('my-page');
      done();
    }
  }, allDone);
});

lab.test('getProjectPages', allDone => {
  async.autoInject({
    register(done) {
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
      server.register({
        register: require('../'),
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
      server.methods.pagedata.getProjectPages('my-project', { populate: 'content' }, done);
    },
    verify(call, done) {
      expect(call[0].content.status).to.equal('hungry');
      expect(call[1].content.status).to.equal('fed');
      done();
    }
  }, allDone);
});

lab.test('getCollectionPages', allDone => {
  async.autoInject({
    register(done) {
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
        register: require('../'),
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
  async.autoInject({
    register(done) {
      mockServer.route({
        method: 'get',
        path: '/api/pages/my-page',
        handler(request, reply) {
          expect(request.query.status).to.equal('published');
          return reply(null, { slug: 'my-page', content: { status: 'hungry' } });
        }
      });
      server.register({
        register: require('../'),
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
      server.methods.pagedata.getPage('my-page', { status: 'published' }, done);
    },
    verify(call, cacheCall, done) {
      console.log(call)
      console.log(cacheCall)
      done();
    }
  }, allDone);
});
