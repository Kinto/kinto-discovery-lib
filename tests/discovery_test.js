"use strict";

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

import {getUserIDHash} from "../lib/index.js";

chai.use(chaiAsPromised);
chai.should();
chai.config.includeStack = true;


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
