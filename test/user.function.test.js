require("dotenv").config();

const request = require("supertest");

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");

let agent;
let saveRes;
let csrfToken;

const { app, server } = require("../app");

beforeAll(async () => {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  agent = request.agent(app);
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe("register a user", () => {
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };

    saveRes = await agent.post("/api/users/register").send(newUser);

    expect(saveRes.status).toBe(201);
  });

  it("47. Registration returns an object with the expected name.", () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  });

  it("48. Test that the returned object includes a csrfToken.", () => {
    csrfToken = saveRes.body.csrfToken;

    expect(csrfToken).toBeDefined();
  });

  it("49. You can logon as the newly registered user.", async () => {
    const user = {
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };

    saveRes = await agent.post("/api/users/logon").send(user);

    expect(saveRes.status).toBe(200);
  });

  it("50. Verify that you are logged in: /api/tasks should not return a 401.", async () => {
    csrfToken = saveRes.body.csrfToken;

    saveRes = await agent.get("/api/tasks").set("X-CSRF-TOKEN", csrfToken);

    expect(saveRes.status).not.toBe(401);
  });

  it("51. Verify that you can log out.", async () => {
    saveRes = await agent
      .post("/api/users/logoff")
      .set("X-CSRF-TOKEN", csrfToken);

    expect(saveRes.status).toBe(200);
  });

  it("52. Make sure that you are really logged out: /api/tasks should now return a 401.", async () => {
    saveRes = await agent.get("/api/tasks").set("X-CSRF-TOKEN", csrfToken);

    expect(saveRes.status).toBe(401);
  });
});
