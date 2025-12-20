import { describe, expect, it, beforeAll } from "bun:test";
import { createSession, getSession, listSessions, deleteSession } from "./session";
import { initDB } from "../database/sqlite";

describe("Session Management", () => {
  beforeAll(() => {
    initDB();
  });

  it("should create a session", async () => {
    const session = await createSession("test-session", { foo: "bar" });
    expect(session.id).toBeDefined();
    expect(session.name).toBe("test-session");
    expect(session.context).toEqual({ foo: "bar" });
    expect(session.status).toBe("active");
  });

  it("should get a session", async () => {
    const created = await createSession("get-test", {});
    const fetched = getSession(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
  });

  it("should list sessions", async () => {
    await createSession("list-1", {});
    await createSession("list-2", {});
    const sessions = listSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
  });

  it("should delete a session", async () => {
    const session = await createSession("delete-me", {});
    deleteSession(session.id);
    const fetched = getSession(session.id);
    expect(fetched).toBeNull();
  });
});
