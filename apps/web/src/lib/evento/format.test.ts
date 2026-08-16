import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateAge,
  formatCPF,
  formatWhatsapp,
  isValidCPF,
  onlyDigits,
} from "./format";

describe("onlyDigits", () => {
  it("strips everything but digits", () => {
    expect(onlyDigits("(92) 9 9999-9999")).toBe("92999999999");
    expect(onlyDigits("123.456.789-00")).toBe("12345678900");
    expect(onlyDigits("")).toBe("");
  });
});

describe("isValidCPF", () => {
  it("accepts a well-known valid CPF (checksum-correct)", () => {
    expect(isValidCPF("111.444.777-35")).toBe(true);
    expect(isValidCPF("11144477735")).toBe(true);
  });

  it("rejects a CPF with a wrong check digit", () => {
    expect(isValidCPF("111.444.777-36")).toBe(false);
  });

  it("rejects CPFs with all repeated digits", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("000.000.000-00")).toBe(false);
  });

  it("rejects CPFs with the wrong length", () => {
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("111.444.777-350")).toBe(false);
  });
});

describe("formatCPF", () => {
  it("formats digits into ###.###.###-## as the user types", () => {
    expect(formatCPF("11144477735")).toBe("111.444.777-35");
    expect(formatCPF("111444777")).toBe("111.444.777");
    expect(formatCPF("111")).toBe("111");
  });

  it("ignores extra digits beyond 11", () => {
    expect(formatCPF("111444777356789")).toBe("111.444.777-35");
  });
});

describe("formatWhatsapp", () => {
  it("formats an 11-digit mobile number", () => {
    expect(formatWhatsapp("92999999999")).toBe("(92) 99999-9999");
  });

  it("formats a 10-digit landline-style number", () => {
    expect(formatWhatsapp("9299999999")).toBe("(92) 9999-9999");
  });
});

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for an invalid date string", () => {
    expect(calculateAge("not-a-date")).toBeNull();
  });

  it("counts the birthday already passed this year", () => {
    expect(calculateAge("2008-01-01")).toBe(18);
  });

  it("does not count a birthday that hasn't happened yet this year", () => {
    expect(calculateAge("2008-08-17")).toBe(17);
  });

  it("counts a birthday that is exactly today", () => {
    expect(calculateAge("2008-08-16")).toBe(18);
  });
});
