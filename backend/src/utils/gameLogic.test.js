import { describe, it, expect } from "vitest";
import { checkGuess } from "./gameLogic.js";

describe("checkGuess", () => {
  it("marks exact matches as correct", () => {
    expect(checkGuess("APPLE", "APPLE")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct"
    ]);
  });

  it("marks letters not in the secret word as absent", () => {
    expect(checkGuess("BRAIN", "CODES")).toEqual([
      "absent",
      "absent",
      "absent",
      "absent",
      "absent"
    ]);
  });

  it("marks present letters in the wrong position correctly", () => {
    expect(checkGuess("RAISE", "SERAI")).toEqual([
      "present",
      "correct",
      "present",
      "present",
      "present"
    ]);
  });

  it("handles duplicate letters so the second guess letter is grey when the secret only contains one occurrence", () => {
    expect(checkGuess("APPLE", "ALARM")).toEqual([
      "correct",
      "absent",
      "absent",
      "present",
      "absent"
    ]);
  });

  it("handles duplicate secret letters correctly when guess letters contain less or equal occurrences", () => {
    expect(checkGuess("LEVEL", "ELATE")).toEqual([
      "present",
      "absent",
      "correct",
      "absent",
      "present"
    ]);
  });
});
