import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

async function unlockApp() {
  const unlockButton = screen.getByRole("button", { name: "🔓" });
  await userEvent.click(unlockButton);
}

describe("critical flows", () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigator.clipboard.writeText.mockClear();
  });

  test("add secret creates item in selected workspace", async () => {
    render(<App />);
    await unlockApp();

    await userEvent.click(screen.getByRole("button", { name: "Secrets" }));
    await userEvent.click(screen.getByRole("button", { name: "Open add secret dialog" }));

    await userEvent.type(screen.getByLabelText("Secret name"), "NEW_TEST_KEY");
    await userEvent.type(screen.getByLabelText("Secret value"), "super-secret-value");
    await userEvent.clear(screen.getByLabelText("Workspace for secret"));
    await userEvent.type(screen.getByLabelText("Workspace for secret"), "AI");

    await userEvent.click(screen.getByRole("button", { name: "Save Secret" }));

    expect(await screen.findByText("NEW_TEST_KEY")).toBeInTheDocument();
  });

  test("rename workspace updates workspace card", async () => {
    render(<App />);
    await unlockApp();

    await userEvent.click(screen.getByRole("button", { name: "Workspaces" }));
    await userEvent.click(screen.getByLabelText("Rename workspace Payments"));

    const renameInput = screen.getByLabelText("Renamed workspace value");
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, "Billing");
    await userEvent.click(screen.getByRole("button", { name: "Save Name" }));

    expect(await screen.findByLabelText("Rename workspace Billing")).toBeInTheDocument();
  });

  test("copy uses secret value", async () => {
    render(<App />);
    await unlockApp();

    await userEvent.click(screen.getByRole("button", { name: "Secrets" }));
    await userEvent.click(screen.getAllByLabelText("Edit secret OPENAI_API_KEY")[0]);

    const valueInput = screen.getByLabelText("Edit secret value for OPENAI_API_KEY");
    await userEvent.clear(valueInput);
    await userEvent.type(valueInput, "real-value-123");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await userEvent.click(screen.getAllByLabelText("Copy secret value for OPENAI_API_KEY")[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("real-value-123");
    });
  });

  test("delete removes selected secrets", async () => {
    render(<App />);
    await unlockApp();

    await userEvent.click(screen.getByRole("button", { name: "Secrets" }));
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    await userEvent.click(screen.getAllByRole("button", { name: /Select secret/ })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialogTitle = await screen.findByText(/Delete 1 Secret/);
    const dialog = dialogTitle.closest(".sheet");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Secrets deleted")).toBeInTheDocument();
  });
});
