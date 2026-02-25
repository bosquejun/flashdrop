import { describe, expect, it } from "vitest";
import { formatDuration, formatPrice, getDiscountPercentage } from "./format";

describe("formatPrice", () => {
  it("formats cents as USD", () => {
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(100)).toBe("$1.00");
    expect(formatPrice(1999)).toBe("$19.99");
    expect(formatPrice(10000)).toBe("$100.00");
  });
});

describe("formatDuration", () => {
  it("returns 00:00:00 for null or negative", () => {
    expect(formatDuration(null)).toBe("00:00:00");
    expect(formatDuration(-100)).toBe("00:00:00");
  });

  it("formats milliseconds as HH:MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(1000)).toBe("00:00:01");
    expect(formatDuration(61000)).toBe("00:01:01");
    expect(formatDuration(3661000)).toBe("01:01:01");
    expect(formatDuration(7325000)).toBe("02:02:05");
  });

  it("floors fractional seconds", () => {
    expect(formatDuration(1500)).toBe("00:00:01");
  });
});

describe("getDiscountPercentage", () => {
  it("computes discount percentage", () => {
    expect(getDiscountPercentage(100, 100)).toBe(0);
    expect(getDiscountPercentage(100, 50)).toBe(50);
    expect(getDiscountPercentage(100, 75)).toBe(25);
    expect(getDiscountPercentage(1000, 700)).toBe(30);
  });
});
