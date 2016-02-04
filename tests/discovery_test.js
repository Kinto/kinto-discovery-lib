"use strict";

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

chai.use(chaiAsPromised);
chai.should();
chai.config.includeStack = true;

describe("getUserIDHash", () => {
  it("should return the same hash for the same userid", () => {
    const hash1 = getUserIDHash('shweta');
    expect(hash1).to.eql(getUserIDHash('shweta'));
  });
});
