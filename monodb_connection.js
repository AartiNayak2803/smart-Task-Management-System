/* ═══════════════════════════════════════════════════════════
   SmartTask – MongoDB Compass Schema
   Database: smarttask_db
   Collections: users, tasks, moods, streaks, profiles,
                settings, projects, roles, messages, admin_settings
   ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────
// 1. COLLECTION: users
// ─────────────────────────────────────────
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "role", "status", "createdAt"],
      properties: {
        _id:       { bsonType: "objectId" },
        name:      { bsonType: "string",  description: "User full name" },
        email:     { bsonType: "string",  description: "Unique email address" },
        password:  { bsonType: "string",  description: "Hashed password (bcrypt)" },
        role:      { bsonType: "string",  enum: ["Admin", "User", "Viewer"], description: "User role" },
        status:    { bsonType: "string",  enum: ["active", "blocked"],       description: "Account status" },
        joined:    { bsonType: "string",  description: "Date joined (DD/MM/YYYY)" },
        createdAt: { bsonType: "date",    description: "Account creation timestamp" },
      }
    }
  }
});

// Sample document – users
db.users.insertOne({
  name:      "Arti Nayak",
  email:     "admin@smarttask.com",
  password:  "$2b$10$hashedpasswordhere",   // bcrypt hash
  role:      "Admin",
  status:    "active",
  joined:    "09/04/2026",
  createdAt: new Date()
});

// Index
db.users.createIndex({ email: 1 }, { unique: true });


// ─────────────────────────────────────────
// 2. COLLECTION: tasks
// ─────────────────────────────────────────
db.createCollection("tasks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "name", "priority", "category", "done", "createdAt"],
      properties: {
        _id:       { bsonType: "objectId" },
        userId:    { bsonType: "objectId", description: "Ref → users._id" },
        name:      { bsonType: "string",   description: "Task title" },
        desc:      { bsonType: "string",   description: "Task description (optional)" },
        priority:  { bsonType: "string",   enum: ["high", "medium", "low"] },
        category:  { bsonType: "string",   enum: ["work", "personal", "study", "health", "other"] },
        date:      { bsonType: "string",   description: "Due date (YYYY-MM-DD)" },
        done:      { bsonType: "bool",     description: "Completion status" },
        completed: { bsonType: "bool",     description: "Admin panel completion flag" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// Sample document – tasks
db.tasks.insertOne({
  userId:    ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  name:      "Complete MongoDB Assignment",
  desc:      "Create schema for SmartTask project",
  priority:  "high",
  category:  "study",
  date:      "2026-04-10",
  done:      false,
  completed: false,
  createdAt: new Date()
});

// Indexes
db.tasks.createIndex({ userId: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ done: 1 });


// ─────────────────────────────────────────
// 3. COLLECTION: moods
// ─────────────────────────────────────────
db.createCollection("moods", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "date", "emoji", "score"],
      properties: {
        _id:    { bsonType: "objectId" },
        userId: { bsonType: "objectId", description: "Ref → users._id" },
        date:   { bsonType: "string",   description: "Log date (YYYY-MM-DD)" },
        emoji:  { bsonType: "string",   description: "Mood emoji (😄 🙂 😐 etc.)" },
        score:  { bsonType: "int",      minimum: 1, maximum: 10, description: "Mood score 1–10" }
      }
    }
  }
});

// Sample document – moods
db.moods.insertOne({
  userId: ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  date:   "2026-04-09",
  emoji:  "😄",
  score:  8
});

// Compound index (one entry per user per day)
db.moods.createIndex({ userId: 1, date: 1 }, { unique: true });


// ─────────────────────────────────────────
// 4. COLLECTION: streaks
// ─────────────────────────────────────────
db.createCollection("streaks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId"],
      properties: {
        _id:      { bsonType: "objectId" },
        userId:   { bsonType: "objectId", description: "Ref → users._id" },
        exercise: { bsonType: "int", minimum: 0, description: "Exercise streak (days)" },
        reading:  { bsonType: "int", minimum: 0, description: "Reading streak (days)" },
        water:    { bsonType: "int", minimum: 0, description: "Water intake streak (days)" }
      }
    }
  }
});

// Sample document – streaks
db.streaks.insertOne({
  userId:   ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  exercise: 5,
  reading:  12,
  water:    7
});

// Index
db.streaks.createIndex({ userId: 1 }, { unique: true });


// ─────────────────────────────────────────
// 5. COLLECTION: profiles
// ─────────────────────────────────────────
db.createCollection("profiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "name"],
      properties: {
        _id:      { bsonType: "objectId" },
        userId:   { bsonType: "objectId", description: "Ref → users._id" },
        name:     { bsonType: "string" },
        role:     { bsonType: "string",   description: "e.g. B.VOC Student" },
        location: { bsonType: "string",   description: "e.g. Ahmedabad" },
        about:    { bsonType: "string",   description: "Short bio" }
      }
    }
  }
});

// Sample document – profiles
db.profiles.insertOne({
  userId:   ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  name:     "Arti Nayak",
  role:     "B.VOC Student",
  location: "Ahmedabad",
  about:    "Passionate student who loves productivity and building good habits every day."
});

// Index
db.profiles.createIndex({ userId: 1 }, { unique: true });


// ─────────────────────────────────────────
// 6. COLLECTION: settings
// ─────────────────────────────────────────
db.createCollection("settings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId"],
      properties: {
        _id:       { bsonType: "objectId" },
        userId:    { bsonType: "objectId", description: "Ref → users._id" },
        darkmode:  { bsonType: "bool" },
        compact:   { bsonType: "bool" },
        reminders: { bsonType: "bool" },
        streak:    { bsonType: "bool" },
        summary:   { bsonType: "bool" }
      }
    }
  }
});

// Sample document – settings
db.settings.insertOne({
  userId:    ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  darkmode:  true,
  compact:   false,
  reminders: true,
  streak:    true,
  summary:   false
});

// Index
db.settings.createIndex({ userId: 1 }, { unique: true });


// ─────────────────────────────────────────
// 7. COLLECTION: projects  (Admin Panel)
// ─────────────────────────────────────────
db.createCollection("projects", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "status"],
      properties: {
        _id:       { bsonType: "objectId" },
        name:      { bsonType: "string" },
        desc:      { bsonType: "string" },
        status:    { bsonType: "string", enum: ["Planning", "Active", "On Hold", "Completed"] },
        team:      { bsonType: "string", description: "Team name or member names" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// Sample document – projects
db.projects.insertOne({
  name:      "SmartTask App",
  desc:      "Productivity and habit tracking web application",
  status:    "Active",
  team:      "Arti Nayak",
  createdAt: new Date()
});


// ─────────────────────────────────────────
// 8. COLLECTION: roles  (Admin Panel)
// ─────────────────────────────────────────
db.createCollection("roles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "color"],
      properties: {
        _id:   { bsonType: "objectId" },
        name:  { bsonType: "string" },
        color: { bsonType: "string", enum: ["blue", "green", "orange", "red", "purple"] }
      }
    }
  }
});

// Default roles
db.roles.insertMany([
  { name: "Admin",  color: "blue"   },
  { name: "User",   color: "green"  },
  { name: "Viewer", color: "orange" }
]);


// ─────────────────────────────────────────
// 9. COLLECTION: messages  (Admin Panel)
// ─────────────────────────────────────────
db.createCollection("messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["to", "type", "title", "body", "sentAt"],
      properties: {
        _id:    { bsonType: "objectId" },
        to:     { bsonType: "string", description: "Recipient (All Users / email)" },
        type:   { bsonType: "string", enum: ["info", "warning", "success", "urgent"] },
        title:  { bsonType: "string" },
        body:   { bsonType: "string" },
        sentAt: { bsonType: "date" }
      }
    }
  }
});

// Sample document – messages
db.messages.insertOne({
  to:     "All Users",
  type:   "info",
  title:  "Welcome to SmartTask!",
  body:   "Start tracking your tasks and habits today.",
  sentAt: new Date()
});


// ─────────────────────────────────────────
// 10. COLLECTION: admin_settings
// ─────────────────────────────────────────
db.createCollection("admin_settings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      properties: {
        _id:      { bsonType: "objectId" },
        dark:     { bsonType: "bool" },
        login:    { bsonType: "bool",   description: "Force login required" },
        appName:  { bsonType: "string", description: "App display name" },
        logoIcon: { bsonType: "string", description: "Emoji or text logo icon" }
      }
    }
  }
});

// Default admin settings
db.admin_settings.insertOne({
  dark:     true,
  login:    true,
  appName:  "SmartTask",
  logoIcon: "⚡"
});


/* ═══════════════════════════════════════════════════════════
   DATABASE SUMMARY
   ───────────────────────────────────────────────────────────
   Database  : smarttask_db
   ───────────────────────────────────────────────────────────
   #   Collection       Fields
   ─── ──────────────── ────────────────────────────────────
   1   users            _id, name, email, password, role,
                        status, joined, createdAt
   2   tasks            _id, userId, name, desc, priority,
                        category, date, done, completed, createdAt
   3   moods            _id, userId, date, emoji, score
   4   streaks          _id, userId, exercise, reading, water
   5   profiles         _id, userId, name, role, location, about
   6   settings         _id, userId, darkmode, compact,
                        reminders, streak, summary
   7   projects         _id, name, desc, status, team, createdAt
   8   roles            _id, name, color
   9   messages         _id, to, type, title, body, sentAt
   10  admin_settings   _id, dark, login, appName, logoIcon
   ═══════════════════════════════════════════════════════════ */
