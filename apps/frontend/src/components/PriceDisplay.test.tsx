import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PriceDisplay from "./PriceDisplay";

describe("PriceDisplay", () => {
  it("renders sale and original price when different", () => {
    render(<PriceDisplay original={10000} sale={7999} />);
    expect(screen.getByText("$79.99")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("renders only sale price when original equals sale", () => {
    render(<PriceDisplay original={5000} sale={5000} />);
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.queryByText(/\$50\.00/)).toBeInTheDocument();
  });

  it("shows discount badge when showDiscount and isLive are true", () => {
    render(
      <PriceDisplay original={10000} sale={7000} showDiscount isLive />
    );
    expect(screen.getByText(/30% Discount Applied/)).toBeInTheDocument();
  });

  it("hides discount badge when isLive is false", () => {
    render(
      <PriceDisplay original={10000} sale={7000} showDiscount isLive={false} />
    );
    expect(screen.queryByText(/Discount Applied/)).not.toBeInTheDocument();
  });
});
