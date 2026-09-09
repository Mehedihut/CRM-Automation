import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("<StatusBadge />", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="NEW" />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("uses the lowercase status as a badge modifier class", () => {
    render(<StatusBadge status="CONTACTED" />);
    const el = screen.getByText("CONTACTED");
    expect(el).toHaveClass("badge");
    expect(el).toHaveClass("badge-contacted");
  });
});