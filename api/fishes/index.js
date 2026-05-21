const fishesByRoom = new Map();

function getRoomId(req) {
  return req.query.roomId || req.body?.roomId || "usyd-web";
}

function listFishes(roomId) {
  return fishesByRoom.get(roomId) || [];
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

  if (method === "GET") {
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { roomId, fishes: listFishes(roomId), fishCount: listFishes(roomId).length },
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

    const nextFishes = [...listFishes(req.body.roomId), req.body];
    fishesByRoom.set(req.body.roomId, nextFishes);
    context.res = {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: { fish: req.body, fishCount: nextFishes.length },
    };
    return;
  }

  if (method === "DELETE") {
    fishesByRoom.set(roomId, []);
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
};
