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

describe("discovery library", () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
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
    const headers = {}
    let userStorageURL;

    describe("With an already existing user URL", () => {
      userStorageURL = "https://my-kinto-instance.com/v1";
      beforeEach(() => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(200, {
          data: {url: userStorageURL}
        }, {}));
      });

      it("should return the existing URL", () => {
        return registerUserURL("userID", centralRepositoryURL, headers, userStorageURL)
        .should.become(userStorageURL);
      });
    });
  });

  describe("retrieveUserURL", () => {

    const centralRepositoryURL = "http://central.kinto-storage.com/v1";
    const headers = {}
    let userStorageURL;

    describe("With an already existing user URL", () => {
      userStorageURL = "https://my-kinto-instance.com/v1";
      const defaultServer = "https://default-kinto-instance.com/v1"
      beforeEach(() => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(200, {
          data: {url: userStorageURL}
        }, {}));
      });

      it("should return the existing URL", () => {
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.become(userStorageURL);
      });
    });
  });

});
