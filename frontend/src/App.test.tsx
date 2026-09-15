import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "./lib/api";

vi.mock("./lib/api", () => ({
  api: {
    config: vi.fn(),
    day: vi.fn(),
    calendar: vi.fn(),
    exercises: vi.fn(),
    backups: vi.fn(),
  },
}));

describe("Rostam shell", () => {
  beforeEach(() => {
    vi.mocked(api.config).mockResolvedValue({ today: "2026-09-13", timezone: "Europe/Warsaw", version: "1.0.0" });
    vi.mocked(api.day).mockResolvedValue({ date: "2026-09-13", sections: [] });
    vi.mocked(api.calendar).mockResolvedValue({ month: "2026-09", activeDates: ["2026-09-13"] });
    vi.mocked(api.exercises).mockResolvedValue([]);
    vi.mocked(api.backups).mockResolvedValue([]);
  });

  it("starts on an empty observational day", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(await screen.findByText("No sets recorded")).toBeInTheDocument();
    expect(screen.queryByText(/goal/i)).not.toBeInTheDocument();
  });

  it("opens a calendar day through the standard ledger", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Today" });
    await user.click(screen.getByRole("button", { name: "Calendar" }));
    await waitFor(() => expect(api.calendar).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /2026-09-13, exercise recorded/ }));
    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();
  });
});
