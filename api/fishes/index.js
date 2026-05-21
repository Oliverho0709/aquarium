const storage = require("../shared/storage");

function getRoomId(req) {
  return req.query.roomId || req.body?.roomId || "usyd-web";
}

function validateFish(candidate) {
  return Boolean(
    candidate &&
      typeof candidate.id === "string" &&
      typeof candidate.roomId === "string" &&
      typeof candidate.creatorName === "string" &&
      typeof candidate.fishName === "string" &&
      typeof candidate.createdAt === "string",
  );
}

module.exports = async function fishesApi(context, req) {
  const method = req.method.toUpperCase();
  const roomId = getRoomId(req);

  try {
    if (method === "GET") {
      const fishes = await storage.listFishes(roomId);
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { roomId, fishes, fishCount: fishes.length },
      };
      return;
    }

    if (method === "POST") {
      if (!validateFish(req.body)) {
        context.res = {
          status: 400,
          body: { error: "Invalid fish payload." },
        };
        return;
      }
      await storage.addFish(req.body);
      const fishes = await storage.listFishes(req.body.roomId);
      context.res = {
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: { fish: req.body, fishCount: fishes.length },
      };
      return;
    }

    if (method === "DELETE") {
      await storage.clearFishes(roomId);
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { roomId, fishes: [], fishCount: 0 },
      };
      return;
    }

    context.res = {
      status: 405,
      headers: { Allow: "GET, POST, DELETE" },
      body: { error: "Method not allowed." },
    };
  } catch (err) {
    context.log.error("[fishes] Unhandled error:", err);
    context.res = {
      status: 500,
      body: { error: "Internal server error." },
    };
  }
};
