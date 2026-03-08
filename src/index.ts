import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs, { stat } from 'fs';
import path from 'path';


import { authenticateToken, AuthRequest } from '../../backend2/src/middleware/auth';
const app = express();
const PORT = 5000;
dotenv.config();
// Middleware
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req: any, file, cb) => {
    // Access the username attached by your authenticateToken middleware
    const username = req.user?.username || 'unknown';
    
    // Create a clean filename: username-timestamp-originalname.ext
    const fileExt = path.extname(file.originalname);
    const fileName = `${username}-${Date.now()}${fileExt}`;
    
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hello from TypeScript Backend! 🚀" });
});

app.post('/data', (req: Request, res: Response) => {
  const { name } = req.body;
  res.status(201).json({ 
    message: `Data received for ${name}`,
    timestamp: new Date().toISOString() 
  });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(5000, () => console.log('Server running on 5000'));
}



app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log("Login Attempt:", username, password);
  // In a real app, verify password here
  if (username === 'paglanahin' && password === 'nahin') {
    const token = jwt.sign({ username }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
      res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }

  
});

// AnalyserNode: Calls OpenAI to analyze the document
const AnalyserNode = async (filename:string, base64File: string) => {
    // send for classification 

    // send for verification
    return {
      status: "success",
      message: `Document ${filename} classified as 'Invoice' and verified as authentic.`
    }
}

// --- 2. DOCUMENT ANALYSIS WORKFLOW ---
app.post('/analyze',  upload.single('document'), async (req: AuthRequest, res) => { // need authenticateToken
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Read file and convert to Base64 for OpenAI
    console.log("here", file.filename)
    const fileBuffer = fs.readFileSync(file.path);
    console.log("not here")
    const base64File = fileBuffer.toString('base64');
    console.log("Base64 File:", base64File[0], base64File[1], base64File[2], "..."); // Log first few chars for verification 
    // Call OpenAI for Analysis
    const response = await AnalyserNode(file.filename, base64File)
    console.log("Analysis Response:", response.status, response.message);
    // Cleanup: Delete the file from local storage after analysis
    // fs.unlinkSync(file.path);

    // Return result to frontend
    res.json({
      message: "Analysis Complete",
      analysis: response.message
    });

  } 
  catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze document" });
  }
})