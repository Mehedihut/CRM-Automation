import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("<Button />", () => {
  it("renders children and defaults to the secondary variant", () => {
    render(<Button onClick={() => undefined}>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveClass("btn");
    expect(btn).toHaveClass("btn-secondary");
  });

  it("applies the variant class when set", () => {
    render(
      <Button variant="primary" onClick={() => undefined}>
        Go
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("btn-primary");
  });

  it("applies the danger variant", () => {
    render(
      <Button variant="danger" onClick={() => undefined}>
        Delete
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("btn-danger");
  });

  it("invokes onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled prop (does not fire onClick)", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        No
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});