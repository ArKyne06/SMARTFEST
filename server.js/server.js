const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper функция для чтения JSON
const readDB = () => {
  try {
    const data = fs.readFileSync('db.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { events: [], schedules: [], customEvents: [] };
  }
};

// Helper функция для записи в JSON
const writeDB = (data) => {
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
};

// API Routes

// GET /api/events - получить все события
app.get('/api/events', (req, res) => {
  const db = readDB();
  const allEvents = [...db.events, ...db.customEvents];
  res.json(allEvents);
});

// POST /api/events - добавить кастомное событие
app.post('/api/events', (req, res) => {
  const db = readDB();
  const newEvent = {
    id: Date.now(),
    ...req.body,
    custom: true
  };
  
  db.customEvents.push(newEvent);
  writeDB(db);
  
  res.status(201).json(newEvent);
});

// GET /api/schedules - получить все расписания
app.get('/api/schedules', (req, res) => {
  const db = readDB();
  res.json(db.schedules);
});

// POST /api/schedules - сохранить расписание
app.post('/api/schedules', (req, res) => {
  const db = readDB();
  const newSchedule = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  
  db.schedules.push(newSchedule);
  writeDB(db);
  
  res.status(201).json(newSchedule);
});

// DELETE /api/schedules/:id - удалить расписание
app.delete('/api/schedules/:id', (req, res) => {
  const db = readDB();
  const scheduleId = parseInt(req.params.id);
  
  db.schedules = db.schedules.filter(s => s.id !== scheduleId);
  writeDB(db);
  
  res.status(204).send();
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎪 Festival Planner Backend running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/`);
});