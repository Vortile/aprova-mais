import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { isValidMercadoPagoSignature } from "./webhook-signature";

function buildSignature(
  secret: string,
  dataId: string,
  requestId: string,
  ts: string,
) {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("isValidMercadoPagoSignature", () => {
  it("allows the request through when no secret is configured yet", () => {
    expect(
      isValidMercadoPagoSignature({
        secret: undefined,
        signatureHeader: null,
        requestId: null,
        dataId: "123",
      }),
    ).toBe(true);
  });

  it("rejects when a secret is configured but headers are missing", () => {
    expect(
      isValidMercadoPagoSignature({
        secret: "my-secret",
        signatureHeader: null,
        requestId: "req-1",
        dataId: "123",
      }),
    ).toBe(false);
  });

  it("accepts a correctly computed signature", () => {
    const secret = "my-secret";
    const dataId = "123456789";
    const requestId = "req-abc";
    const ts = "1700000000";
    const signatureHeader = buildSignature(secret, dataId, requestId, ts);

    expect(
      isValidMercadoPagoSignature({
        secret,
        signatureHeader,
        requestId,
        dataId,
      }),
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const secret = "my-secret";
    const dataId = "123456789";
    const requestId = "req-abc";
    const ts = "1700000000";
    const signatureHeader = buildSignature(
      secret,
      dataId,
      requestId,
      ts,
    ).replace(/v1=./, "v1=x");

    expect(
      isValidMercadoPagoSignature({
        secret,
        signatureHeader,
        requestId,
        dataId,
      }),
    ).toBe(false);
  });

  it("rejects when the payment id (dataId) doesn't match what was signed", () => {
    const secret = "my-secret";
    const requestId = "req-abc";
    const ts = "1700000000";
    const signatureHeader = buildSignature(secret, "123456789", requestId, ts);

    expect(
      isValidMercadoPagoSignature({
        secret,
        signatureHeader,
        requestId,
        dataId: "999999999",
      }),
    ).toBe(false);
  });

  it("rejects a malformed signature header missing ts/v1", () => {
    expect(
      isValidMercadoPagoSignature({
        secret: "my-secret",
        signatureHeader: "garbage-header",
        requestId: "req-abc",
        dataId: "123",
      }),
    ).toBe(false);
  });
});
