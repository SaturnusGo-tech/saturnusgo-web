import assert from "node:assert/strict";
import test from "node:test";
import { companyAddress } from "../domain/company-address";

test("company entry accepts a slug or a canonical HTTPS company address in the configured zone", () => {
  for (const value of [" Umbrella ", "umbrella-falcon.saturnusgo.com", "https://umbrella-falcon.saturnusgo.com/"]) {
    assert.equal(companyAddress(value, "saturnusgo.com"), "https://umbrella-falcon.saturnusgo.com/");
  }
  assert.equal(companyAddress("alpha", "falcon.example"), "https://alpha-falcon.falcon.example/");
});
test("company entry cannot become an open redirect, a platform login or a credential-bearing link", () => {
  for (const value of ["sandbox", "https://sandbox-falcon.saturnusgo.com", "https://evil.example",
    "https://alpha-falcon.saturnusgo.com.evil.example", "https://evil.example@alpha-falcon.saturnusgo.com",
    "https://alpha-falcon.saturnusgo.com/path", "http://alpha-falcon.saturnusgo.com",
    "https://alpha-falcon.saturnusgo.com:8080", "https://alpha-falcon.saturnusgo.com?next=evil",
    "alpha/subpath", "alpha.falcon", "javascript:alert(1)", "alpha\\evil", "", "аlpha"]) {
    assert.equal(companyAddress(value, "saturnusgo.com"), null, value);
  }
});
