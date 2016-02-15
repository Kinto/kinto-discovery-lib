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

    describe("when server returns a 5xx", () => {
      userStorageURL = "https://my-kinto-instance.com/v1";
      const defaultServer = "https://default-kinto-instance.com/v1"


      it("should return an error in case of 501 ", () => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(501, {
          data: {url: userStorageURL}
          }, {} ));
        return registerUserURL("userID", centralRepositoryURL, headers, userStorageURL)
        .should.be.rejectedWith(Error);
      })

      it("should return an error in case of 500", () => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(500, {
          data: {url: userStorageURL}
          }, {} ));
        return registerUserURL("userID", centralRepositoryURL, headers, userStorageURL)
        .should.be.rejectedWith(Error);
      })

      it("should return an error in case of 503", () => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(503, {
          data: {url: userStorageURL}
          }, {} ));
        return registerUserURL("userID", centralRepositoryURL, headers, userStorageURL)
        .should.be.rejectedWith(Error);
      })
     });


    describe("if headers are empty", () => {
      userStorageURL = "https://my-kinto-instance.com/v1";

      it("should return an error message", () => {
        registerUserURL("userID", centralRepositoryURL, headers, userStorageURL)
        .should.become(Error);
      });
    });


  describe("Invalid headers", () => {
    userStorageURL = "https://my-kinto-instance.com/v1";

    beforeEach(() => {
      sandbox.stub(root, "fetch").returns(fakeServerResponse(401, {
        data: {url: userStorageURL}
      }, {}));
    });


    it("should reject promise with error message", () => {
      return registerUserURL("userID", centralRepositoryURL, headers, userStorageURL)
      .should.be.rejectedWith(Error);
    });
  });
});

  describe("retrieveUserURL", () => {

    const centralRepositoryURL = "http://central.kinto-storage.com/v1";
    const headers = {}
    let userStorageURL;

    describe("when server returns a 5xx", () => {
      userStorageURL = "https://my-kinto-instance.com/v1";
      const defaultServer = "https://default-kinto-instance.com/v1"


      it("should return an error in case of 501 ", () => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(501, {
          data: {url: userStorageURL}
          }, {} ));
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.be.rejectedWith(Error);
      })

      it("should return an error in case of 500", () => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(500, {
          data: {url: userStorageURL}
          }, {} ));
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.be.rejectedWith(Error);
      })

      it("should return an error in case of 503", () => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(503, {
          data: {url: userStorageURL}
          }, {} ));
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.be.rejectedWith(Error);
      })
     });



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

    describe("without existing url", () => {
      userStorageURL = "https://my-kinto-instance.com/v1";
      const defaultServer = "https://default-kinto-instance.com/v1"
      beforeEach(() => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(404, {
          data: {url: userStorageURL}
        }, {}));
      });


      it("should return the default URL", () => {
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.become(defaultServer);
      });
    });

    describe("First time access or error 403", () => {

      const defaultServer = "https://default-kinto-instance.com/v1"
      beforeEach(() => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(403, {
          data: {url: userStorageURL}
        }, {}));
      });


      it("should return the default URL", () => {
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.become(defaultServer);
      });
    });

    describe("Invalid headers", () => {

      const defaultServer = "https://default-kinto-instance.com/v1"
      beforeEach(() => {
        sandbox.stub(root, "fetch").returns(fakeServerResponse(401, {
          data: {url: userStorageURL}
        }, {}));
      });


      it("should reject promise with error message", () => {
        return retrieveUserURL("userID", centralRepositoryURL, headers, defaultServer)
        .should.be.rejectedWith(Error);
      });
    });


    describe("if default server is null", () => {
      it("should return message: default server is null", () => {
        const message = retrieveUserURL("userID", centralRepositoryURL, headers,"" )
         expect(message).to.eql("default server is null");
      });
    });


  });
});
