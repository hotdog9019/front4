const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");

require("dotenv").config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/pr20";

function toResponse(user) {
  return {
    id: user._id.toString(),
    first_name: user.first_name,
    last_name: user.last_name,
    age: user.age,
    created_at: Math.floor(new Date(user.created_at).getTime() / 1000),
    updated_at: Math.floor(new Date(user.updated_at).getTime() / 1000),
  };
}

function parseAge(value) {
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0) {
    return null;
  }
  return age;
}

function validateUserPayload(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.first_name !== undefined) {
    const value = String(body.first_name || "").trim();
    if (!value) {
      errors.push("first_name is required");
    } else {
      data.first_name = value;
    }
  }

  if (!partial || body.last_name !== undefined) {
    const value = String(body.last_name || "").trim();
    if (!value) {
      errors.push("last_name is required");
    } else {
      data.last_name = value;
    }
  }

  if (!partial || body.age !== undefined) {
    const age = parseAge(body.age);
    if (age === null) {
      errors.push("age must be a non-negative integer");
    } else {
      data.age = age;
    }
  }

  return { data, errors };
}

app.get("/health", async (_req, res) => {
  const state = mongoose.connection.readyState;
  const statuses = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: state === 1 ? "ok" : "error",
    database: statuses[state] || "unknown",
  });
});

app.post("/api/users", async (req, res) => {
  const { data, errors } = validateUserPayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const user = await User.create(data);
    return res.status(201).json(toResponse(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const users = await User.find().sort({ _id: 1 });
    return res.json(users.map(toResponse));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid MongoDB id" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(toResponse(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid MongoDB id" });
  }

  const { data, errors } = validateUserPayload(req.body || {}, { partial: true });
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(toResponse(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid MongoDB id" });
  }

  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "User deleted",
      user: toResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

async function bootstrap() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`PR20 server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
