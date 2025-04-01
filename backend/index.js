require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Job = require('./models/Job');
const Application = require('./models/Application');

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => 
    cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      allowedTypes.includes(file.mimetype) 
        ? cb(null, true)
        : cb(new Error('Invalid file type. Only PDF/DOC/DOCX/JPEG/PNG allowed'));
    }
  }).fields([
    { name: 'resume', maxCount: 3 },
    { name: 'coverLetter', maxCount: 3 },
    { name: 'portfolio', maxCount: 5 }
  ]);

async function seedJobs() {
  const count = await Job.countDocuments();
  if (count === 0) {
    await Job.insertMany([
      { title: 'Software Engineer', company: 'Tech Corp', location: 'Remote' },
      { title: 'Product Manager', company: 'Innovate Inc', location: 'New York' }
    ]);
    console.log('Sample jobs seeded');
  }
}

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/apply', (req, res, next) => {
    upload(req, res, async (err) => {
      try {
        if (err) throw err;
        
        const { name, email, jobId } = req.body;
        const files = req.files;
  
        if (!name || !email || !jobId) {
          return res.status(400).json({ error: 'Name, email, and job ID are required' });
        }
  
        if (!files?.resume?.length) {
          return res.status(400).json({ error: 'At least one resume is required' });
        }
  
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ error: 'Job not found' });
  
        const application = new Application({
          name,
          email,
          resumes: files.resume?.map(file => file.filename) || [],
          coverLetters: files.coverLetter?.map(file => file.filename) || [],
          portfolios: files.portfolio?.map(file => file.filename) || [],
          jobId
        });
  
        await application.save();
        res.json({ message: 'Application submitted successfully!' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedJobs();
});