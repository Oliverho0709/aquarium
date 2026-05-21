// Storage adapter for fish records.
//
// Provides two interchangeable backends behind a single interface:
//   - In-memory (default) — used during local dev or when no connection string is set.
//   - Azure Table Storage — used in production when AZURE_STORAGE_CONNECTION_STRING is set.
//
// Interface:
//   listFishes(roomId)  -> Promise<Fish[]>
//   addFish(fish)        -> Promise<Fish>
//   clearFishes(roomId)  -> Promise<void>

const TABLE_NAME = process.env.AQUARIUM_TABLE_NAME || "fishes";
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Fields persisted on each fish entity. Keep flat — Table Storage entities
// are key/value pairs, not nested objects.
const FISH_FIELDS = [
  "creatorName",
  "fishName",
  "creationMode",
  "templateId",
  "description",
  "svgMarkup",
  "bodyColor",
  "finColor",
  "tailColor",
  "patternColor",
  "createdAt",
];

// ---------- In-memory backend ----------

function createMemoryBackend() {
  const fishesByRoom = new Map();

  return {
    name: "memory",
    async listFishes(roomId) {
      return [...(fishesByRoom.get(roomId) || [])];
    },
    async addFish(fish) {
      const current = fishesByRoom.get(fish.roomId) || [];
      const next = [...current, fish];
      fishesByRoom.set(fish.roomId, next);
      return fish;
    },
    async clearFishes(roomId) {
      fishesByRoom.set(roomId, []);
    },
  };
}

// ---------- Azure Table Storage backend ----------

function entityToFish(entity) {
  const fish = {
    id: entity.rowKey,
    roomId: entity.partitionKey,
  };
  for (const field of FISH_FIELDS) {
    if (entity[field] !== undefined && entity[field] !== null) {
      fish[field] = entity[field];
    }
  }
  return fish;
}

function fishToEntity(fish) {
  const entity = {
    partitionKey: fish.roomId,
    rowKey: fish.id,
  };
  for (const field of FISH_FIELDS) {
    if (fish[field] !== undefined && fish[field] !== null) {
      entity[field] = fish[field];
    }
  }
  return entity;
}

function createTableBackend(client) {
  return {
    name: "azure-table",
    async listFishes(roomId) {
      const results = [];
      const iterator = client.listEntities({
        queryOptions: { filter: `PartitionKey eq '${roomId.replace(/'/g, "''")}'` },
      });
      for await (const entity of iterator) {
        results.push(entityToFish(entity));
      }
      // Oldest first so fish appear in submission order.
      results.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      return results;
    },
    async addFish(fish) {
      await client.upsertEntity(fishToEntity(fish), "Replace");
      return fish;
    },
    async clearFishes(roomId) {
      const iterator = client.listEntities({
        queryOptions: { filter: `PartitionKey eq '${roomId.replace(/'/g, "''")}'` },
      });
      const deletes = [];
      for await (const entity of iterator) {
        deletes.push(client.deleteEntity(entity.partitionKey, entity.rowKey));
      }
      await Promise.all(deletes);
    },
  };
}

// ---------- Backend selection (memoized) ----------

let backendPromise;

async function resolveBackend() {
  if (!CONNECTION_STRING) {
    return createMemoryBackend();
  }
  try {
    const { TableClient } = require("@azure/data-tables");
    const allowInsecure = CONNECTION_STRING.includes("UseDevelopmentStorage");
    const client = TableClient.fromConnectionString(CONNECTION_STRING, TABLE_NAME, {
      allowInsecureConnection: allowInsecure,
    });
    try {
      await client.createTable();
    } catch (err) {
      // 409 (already exists) is fine; anything else we re-throw.
      if (err.statusCode !== 409) throw err;
    }
    return createTableBackend(client);
  } catch (err) {
    console.warn(
      "[storage] Failed to initialise Azure Table Storage, falling back to in-memory:",
      err.message,
    );
    return createMemoryBackend();
  }
}

function getBackend() {
  if (!backendPromise) {
    backendPromise = resolveBackend();
  }
  return backendPromise;
}

// ---------- Public API ----------

async function listFishes(roomId) {
  const backend = await getBackend();
  return backend.listFishes(roomId);
}

async function addFish(fish) {
  const backend = await getBackend();
  return backend.addFish(fish);
}

async function clearFishes(roomId) {
  const backend = await getBackend();
  return backend.clearFishes(roomId);
}

async function backendName() {
  const backend = await getBackend();
  return backend.name;
}

module.exports = {
  listFishes,
  addFish,
  clearFishes,
  backendName,
};
