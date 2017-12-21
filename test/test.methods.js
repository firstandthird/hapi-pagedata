/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');
let server;
let mockServer;

lab.beforeEach(async() => {
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

lab.afterEach(async() => {
  await server.stop();
  await mockServer.stop();
});

lab.test('getPage', async() => {
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
      timeout: 800,
    }
  });
  await server.start();
  const call = await server.methods.pagedata.getPage('my-page', { status: 'published' });
  expect(typeof call.content).to.equal('object');
  expect(call.content.status).to.equal('hungry');
  expect(call.slug).to.equal('my-page');
});

lab.test('getPageContent', async () => {
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
      timeout: 500
    }
  });
  await server.start();
  const call = await server.methods.pagedata.getPageContent('my-page', { status: 'published' });
  expect(typeof call).to.equal('object');
  expect(call.status).to.equal('hungry');
});

lab.test('getProjectPages', async() => {
  mockServer.route({
    method: 'get',
    path: '/api/pages',
    handler(request, h) {
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
      timeout: 500
    }
  });
  await server.start();
  const call = await server.methods.pagedata.getProjectPages('my-project', { populate: 'content' });
  expect(call[0].content.status).to.equal('hungry');
  expect(call[1].content.status).to.equal('fed');
});

lab.test('getCollectionPages', async() => {
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
  const call = await server.methods.pagedata.getCollectionPages('my-collection', { populate: 'content' });
  expect(call[0].content.status).to.equal('hungry');
  expect(call[1].content.status).to.equal('fed');
});

lab.test('getPage --cache', async() => {
  let status = 'hungry';
  mockServer.route({
    method: 'get',
    path: '/api/pages/my-page',
    handler(request, h) {
      expect(request.query.status).to.equal('published');
      return { slug: 'my-page', content: { status } };
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
  const call = await server.methods.pagedata.getPage('my-page', { status: 'published' });
  status = 'fed';
  const cacheCall = await server.methods.pagedata.getPage('my-page', { status: 'published' });
  // cached value will not be updated:
  expect(call.content.status).to.equal(cacheCall.content.status);
});

lab.test('getPage - timeout', async() => {
  mockServer.route({
    method: 'get',
    path: '/api/pages/my-page',
    async handler(request, h) {
      expect(request.query.status).to.equal('published');
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      await wait(700);
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
      timeout: 500,
    }
  });
  await server.start();
  try {
    await server.methods.pagedata.getPage('my-page', { status: 'published' });
  } catch (err) {
    expect(typeof err).to.equal('object');
    expect(err.output.statusCode).to.equal(504);
  }
});
