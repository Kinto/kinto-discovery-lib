"use strict";

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

import {getUserIDHash, registerUserURL, retrieveUserURL} from "../lib/index.js";
import { fakeServerResponse } from "./test_utils.js";

chai.use(chaiAsPromised);
chai.should();
chai.config.includeStack = true;

const root = typeof window === "object" ? window : global;

var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = new LocalStorage('./lib/localStorage');


describe("discovery library", () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    localStorage.clear();
  });

  afterEach(() => {
    sandbox.restore();
  });
  
  describe("getUserIDHash", () => {
    it("should return the same hash for the same userid", () => {
      const hash = getUserIDHash("shweta");
      expect(hash).to.eql(getUserIDHash("shweta"));
    });
    
    it("should return different hashes for different values", () => {
      const hash = getUserIDHash("shweta");
      expect(hash).to.not.eql(getUserIDHash("alexis"));
    });

    it("should return an uuid", () => {
      const hash = getUserIDHash("shweta");
      expect(hash).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    });
  });
  
  describe("registerUserURL", () => {

    const centralRepositoryURL = "http://central.kinto-storage.com/v1";
    const headers = {'Authorization': 'Bearer 1234567'};
    const userStorageURL = "https://my-kinto-instance.com/v1";

    it("should set the new URL.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(200, {
        data: {url: userStorageURL}
      }, {}));
      registerUserURL("userID", centralRepositoryURL, headers,
                             userStorageURL, localStorage)
        .should.become(userStorageURL);
    });

    it("should return an error in case of 401.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(401, {}, {} ));
      registerUserURL("userID", centralRepositoryURL, headers,
                             userStorageURL, localStorage)
        .should.be.rejectedWith(Error, /Invalid Authentication headers./);
    });

    it("should return an error in case of 500.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(500, {}, {} ));
      registerUserURL("userID", centralRepositoryURL, headers,
                             userStorageURL, localStorage)
        .should.be.rejectedWith(Error, /Server not available./);
    });

    it("should return an error in case of 503.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(503, {}, {} ));
      registerUserURL("userID", centralRepositoryURL, headers,
                             userStorageURL, localStorage)
        .should.be.rejectedWith(Error, /Server not available./);
    });
    
    it("should reject an error in case of 403.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(403, {}, {} ));
      registerUserURL("userID", centralRepositoryURL, headers, 
                             userStorageURL, localStorage)
        .should.be.rejectedWith(Error, /Central repository not correctly configured./);
    });

    it("should return an error message if headers are empty", () => {
      registerUserURL("userID", centralRepositoryURL, {},
                      userStorageURL, localStorage)
        .should.become(Error, /Missing Authorization header./);
    });
  });

  describe("retrieveUserURL", () => {

    const centralRepositoryURL = "http://central.kinto-storage.com/v1";
    const headers = {'Authorization': 'Bearer 1234567'};
    const userStorageURL = "https://my-kinto-instance.com/v1";
    const defaultServer = "https://default-kinto-instance.com/v1"

    it("should return an error message if headers are empty.", () => {
      retrieveUserURL("userID", centralRepositoryURL, {}, defaultServer,
                      localStorage)
        .should.become(Error, /Missing Authorization header./);
    });

    it("should return an error in case of 401.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(401, {}, {} ));
      retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                      localStorage)
        .should.be.rejectedWith(Error, /Invalid Authentication headers./);
    });

    it("should return an error in case of 500.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(500, {}, {} ));
      retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                      localStorage)
        .should.be.rejectedWith(Error, /Server not available./);
    });

    it("should return an error in case of 503.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(503, {}, {} ));
      retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                      localStorage)
        .should.be.rejectedWith(Error, /Server not available./);
    });
    
    it("should reject an error in case of 403.", () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(403, {}, {} ));
      retrieveUserURL("userID", centralRepositoryURL, headers,  defaultServer,
                      localStorage)
        .should.be.rejectedWith(Error, /Central repository not correctly configured./);
    });


    it("should return the existing user URL.",  () => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(200, {
        data: {url: userStorageURL}
      }, {}));
      retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                     localStorage)
        .should.become(userStorageURL);
    });

    it("should return the defaultServer in case an user URL was not found.",
       () => {
         sandbox.stub(root, "fetch").returns(fakeServerResponse(404, {}, {}));
         retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                         localStorage)
           .should.become(defaultServer);
       });

    it("should return the defaultServer in case a permission error occured.",
       () => {
         sandbox.stub(root, "fetch").returns(fakeServerResponse(403, {}, {}));
         retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                         localStorage)
           .should.become(defaultServer);
       });

    it("should return the cached value in case we have it.", () => {
      const key = 'kinto:server-url:' + 'userID';
      const cachedValue = "https://my-cached-kinto-instance.com/v1"
      localStorage.setItem(key, cachedValue);
      retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                      localStorage)
        .should.become(cachedValue);
    });

    it("should not called fetch in case we have a cached value.", () => {
      const key = 'kinto:server-url:' + 'userID';
      const cachedValue = "https://my-cached-kinto-instance.com/v1"
      const stubFetch = sandbox.stub(root, "fetch").returns(
        fakeServerResponse(403, {}, {})
      );
      localStorage.setItem(key, cachedValue);
      retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer,
                      localStorage)
        .should.become(cachedValue);
      expect(stubFetch.called).eql(false);
    });

    it("should raise an error if the defaultServer is not defined.", () => {
      retrieveUserURL("userID", centralRepositoryURL, headers, undefined,
                      localStorage)
        .should.be.rejectedWith(Error, /defaultServer should be defined./);
    });

    it("should raise an error if the defaultServer is empty.", () => {
      retrieveUserURL("userID", centralRepositoryURL, headers, "",
                      localStorage)
        .should.be.rejectedWith(Error, /defaultServer should be defined./);
    });

    it("should raise an error if the defaultServer is null.", () => {
      retrieveUserURL("userID", centralRepositoryURL, headers, null,
                      localStorage)
        .should.be.rejectedWith(Error, /defaultServer should be defined./);
    });
  });
});
