const WELCOME_FLAG_KEY = "welcome-name";

// Carries the person's name across the redirect from sign-in to the day
// screen. sessionStorage rather than a query parameter: a parameter would
// stay in the address bar and repeat the toast on every reload.
// Private mode in Safari throws on access, and a greeting must never be the
// reason a screen fails, so both functions swallow the error.
export const writeWelcomeFlag = (name: string): void => {
  try {
    sessionStorage.setItem(WELCOME_FLAG_KEY, name);
  } catch {
    // Storage is unavailable: the greeting is simply skipped.
  }
};

// Reads and removes the flag in one step, so the toast shows exactly once.
export const readWelcomeFlag = (): string | null => {
  try {
    const name = sessionStorage.getItem(WELCOME_FLAG_KEY);

    if (name !== null) sessionStorage.removeItem(WELCOME_FLAG_KEY);

    return name;
  } catch {
    return null;
  }
};
