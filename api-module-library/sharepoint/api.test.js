const Authenticator = require('@friggframework/test-environment/Authenticator');
const { Api } = require('./api');
const config = require('./defaultConfig.json');
const nock = require('nock');
const chai = require('chai');
const expect = chai.expect;

describe(`${config.label} API Tests`, () => {
    const baseUrl = 'https://graph.microsoft.com/v1.0';

    describe('#constructor', () => {
        describe('Create new API with params', () => {
            let api;

            beforeEach(() => {
                const params = {
                    tenant_id: 'tenant_id',
                    state: 'state',
                    forceConsent: 'forceConsent',
                };

                api = new Api(params);
            });

            it('should have all properties filled', () => {
                expect(api.backOff).to.eql([1, 3]);
                expect(api.baseUrl).to.equal(baseUrl);
                expect(api.tenant_id).to.equal('tenant_id');
                expect(api.state).to.equal('state');
                expect(api.forceConsent).to.equal('forceConsent');
                expect(api.URLs.userDetails).to.equal('/me');
                expect(api.URLs.orgDetails).to.equal('/organization');
                expect(api.URLs.defaultSite).to.equal('/sites/root');
                expect(api.URLs.allSites).to.equal('/sites?search=*');
                expect(api.URLs.defaultDrives).to.equal('/sites/root/drives');
                expect(api.URLs.drivesBySite('siteId')).to.equal('/sites/siteId/drives');
                expect(api.URLs.rootFolders({
                    driveId: 'driveId',
                    childId: 'childId'
                })).to.equal('/drives/driveId/items/childId/children?$expand=thumbnails&top=8&$filter=');
                expect(api.URLs.folderChildren('childId')).to.equal('/me/drive/items/childId/children?$filter=');
                expect(api.URLs.getFile({
                    driveId: 'driveId',
                    fileId: 'fileId'
                })).to.equal('/drives/driveId/items/fileId?$expand=listItem');
                expect(api.URLs.search({
                    driveId: 'driveId',
                    query: 'query'
                })).to.equal("/drives/driveId/root/search(q='query')?top=20&$select=id,image,name,file,parentReference,size,lastModifiedDateTime,@microsoft.graph.downloadUrl&$filter=");
                expect(api.authorizationUri).to.equal('https://login.microsoftonline.com/tenant_id/oauth2/v2.0/authorize');
                expect(api.tokenUri).to.equal('https://login.microsoftonline.com/tenant_id/oauth2/v2.0/token');
            });
        });

        describe('Create new API without params', () => {
            let api;

            beforeEach(() => {
                api = new Api();
            });

            it('should have all properties filled', () => {
                expect(api.backOff).to.eql([1, 3]);
                expect(api.baseUrl).to.equal(baseUrl);
                expect(api.tenant_id).to.equal('common');
                expect(api.state).to.be.null;
                expect(api.forceConsent).to.be.true;
                expect(api.URLs.userDetails).to.equal('/me');
                expect(api.URLs.orgDetails).to.equal('/organization');
                expect(api.URLs.defaultSite).to.equal('/sites/root');
                expect(api.URLs.allSites).to.equal('/sites?search=*');
                expect(api.URLs.defaultDrives).to.equal('/sites/root/drives');
                expect(api.URLs.drivesBySite('siteId')).to.equal('/sites/siteId/drives');
                expect(api.URLs.rootFolders({
                    driveId: 'driveId',
                    childId: 'childId'
                })).to.equal('/drives/driveId/items/childId/children?$expand=thumbnails&top=8&$filter=');
                expect(api.URLs.folderChildren('childId')).to.equal('/me/drive/items/childId/children?$filter=');
                expect(api.URLs.getFile({
                    driveId: 'driveId',
                    fileId: 'fileId'
                })).to.equal('/drives/driveId/items/fileId?$expand=listItem');
                expect(api.URLs.search({
                    driveId: 'driveId',
                    query: 'query'
                })).to.equal("/drives/driveId/root/search(q='query')?top=20&$select=id,image,name,file,parentReference,size,lastModifiedDateTime,@microsoft.graph.downloadUrl&$filter=");
                expect(api.authorizationUri).to.equal('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
                expect(api.tokenUri).to.equal('https://login.microsoftonline.com/common/oauth2/v2.0/token');
            });
        });
    });

    describe('#getAuthUri', () => {
        describe('Generate Auth Url', () => {
            let api;

            beforeEach(() => {
                const apiParams = {
                    client_id: 'client_id',
                    client_secret: 'client_secret',
                    redirect_uri: 'redirect_uri',
                    scope: 'scope',
                    state: 'state',
                    forceConsent: true,
                };

                api = new Api(apiParams);
            });

            it('should return auth url', () => {
                const link = 'https://login.microsoftonline.com/'
                      + 'common/oauth2/v2.0/authorize?'
                      + 'client_id=client_id&response_type=code&redirect_uri=redirect_uri&scope=scope&state=state&prompt=select_account';
                expect(api.getAuthUri()).to.equal(link);
            });
        });

        describe('Generate Auth Url without prompt', () => {
            let api;

            beforeEach(() => {
                const apiParams = {
                    client_id: 'client_id',
                    client_secret: 'client_secret',
                    redirect_uri: 'redirect_uri',
                    scope: 'scope',
                    state: 'state',
                    forceConsent: false,
                };

                api = new Api(apiParams);
            });

            it('should return auth url', () => {
                const link = 'https://login.microsoftonline.com/'
                      + 'common/oauth2/v2.0/authorize?'
                      + 'client_id=client_id&response_type=code&redirect_uri=redirect_uri&scope=scope&state=state';
                expect(api.getAuthUri()).to.equal(link);
            });
        });
    });

    describe('HTTP Requests', () => {
        let api;

        beforeAll(() => {
            api = new Api();
        });

        afterEach(() => {
            nock.cleanAll();
        });

        describe('#getUser', () => {
            describe('Retrieve information about the user', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/me')
                        .reply(200, {
                            me: 'me',
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const user = await api.getUser();
                    expect(user).to.eql({ me: 'me' });
                });
            });
        });

        describe('#getOrganization', () => {
            describe('Retrieve information about the organization', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/organization')
                        .reply(200, {
                            value: [{
                                org: 'org'
                            }]
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const org = await api.getOrganization();
                    expect(org).to.eql({ org: 'org' });
                });
            });
        });

        describe('#listSites', () => {
            describe('Retrieve information about sites', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/sites?search=*')
                        .reply(200, {
                            sites: 'sites'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const sites = await api.listSites();
                    expect(sites).to.eql({ sites: 'sites' });
                });
            });
        });

        describe('#listDrives', () => {
            describe('Retrieve information about drives', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/sites/siteId/drives')
                        .reply(200, {
                            drives: 'drives'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const drives = await api.listDrives({ siteId: 'siteId' });
                    expect(drives).to.eql({ drives: 'drives' });
                });
            });
        });

        describe('#retrieveFolder', () => {
            describe('Retrieve information about the root folder', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/drives/driveId/items/root/children?$expand=thumbnails&top=8&$filter=')
                        .reply(200, {
                            folder: 'root'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const params = {
                        driveId: 'driveId'            
                    };

                    const folder = await api.retrieveFolder(params);
                    expect(folder).to.eql({ folder: 'root' });
                });
            });

            describe('Retrieve information about a folder', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/drives/driveId/items/folderId/children?$expand=thumbnails&top=8&$filter=')
                        .reply(200, {
                            folder: 'folder'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const params = {
                        driveId: 'driveId',
                        folderId: 'folderId'
                    };

                    const folder = await api.retrieveFolder(params);
                    expect(folder).to.eql({ folder: 'folder' });
                });
            });
        });

        describe('#search', () => {
            describe('Perform a search', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/drives/driveId/root/search(q=%27q%27)?top=20&$select=id,image,name,file,parentReference,size,lastModifiedDateTime,@microsoft.graph.downloadUrl&$filter=')
                        .reply(200, {
                            results: 'results'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const params = {
                        driveId: 'driveId',
                        q: 'q'
                    };

                    const results = await api.search(params);
                    expect(results).to.eql({ results: 'results' });
                });
            });

            describe('Perform a search incluing nextPageUrl', () => {
                beforeEach(() => {
                    nock('http://nextPageUrl')
                        .get('/')
                        .reply(200, {
                            results: 'results'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const params = {
                        driveId: 'driveId',
                        q: 'q',
                        nextPageUrl: 'http://nextPageUrl/'
                    };

                    const results = await api.search(params);
                    expect(results).to.eql({ results: 'results' });
                });
            });
        });

        describe('#retrieveFile', () => {
            describe('Retrieve information about drives', () => {
                beforeEach(() => {
                    nock(baseUrl)
                        .get('/drives/driveId/items/fileId?$expand=listItem')
                        .reply(200, {
                            file: 'file'
                        });
                });

                it('should hit the correct endpoint', async () => {
                    const params = {
                        driveId: 'driveId',
                        fileId: 'fileId'
                    };

                    const file = await api.retrieveFile(params);
                    expect(file).to.eql({ file: 'file' });
                });
            });
        });
    });
});
