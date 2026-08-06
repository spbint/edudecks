import { describe, expect, it, vi } from "vitest";
import { requestCoachStateRefresh, subscribeToCoachStateRefresh } from "./coachRefresh";

describe("Coach refresh contract", () => {
  it("publishes one safe source detail and supports unsubscribe", () => {
    const listeners = new Map<string, EventListener>();
    const fakeWindow = {
      addEventListener: (name: string, listener: EventListener) => listeners.set(name, listener),
      removeEventListener: (name: string) => listeners.delete(name),
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.(event);
        return true;
      },
    } as unknown as Window;
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("CustomEvent", class CustomEvent<T> extends Event {
      detail: T;
      constructor(type: string, init: { detail: T }) {
        super(type);
        this.detail = init.detail;
      }
    });

    const received: unknown[] = [];
    const unsubscribe = subscribeToCoachStateRefresh((detail) => received.push(detail));
    requestCoachStateRefresh("learning-year-created");
    expect(received).toEqual([{ source: "learning-year-created", refreshAlreadyApplied: false }]);
    unsubscribe();
    requestCoachStateRefresh("weekly-block-created", { refreshAlreadyApplied: true });
    expect(received).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});
