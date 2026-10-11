# CareerForge

Mock-interview app: React UI + Express API + Flask ML (camera and voice).

## Run on another computer

Copy the **project folder** (USB, zip, or git). Do **not** copy `node_modules`, `backend/node_modules`, `backend/.env`, or `backend/data`.

Install once on the new PC:

- [Node.js LTS](https://nodejs.org) (includes npm)
- [Python 3.10+](https://www.python.org/downloads/) — Windows: tick **Add python.exe to PATH**
- Chrome or Edge

MySQL is optional. Without it, accounts are stored in `backend/data/`.

### Windows (PowerShell)

Replace the path with the folder on that PC.

**Once — install libraries**

```powershell
cd "C:\Users\YOUR_NAME\Desktop\ai_careerforge"

node -v
npm -v
py -3 --version

npm install

cd backend
npm install
Copy-Item .env.example .env
cd ..

cd ml_service
py -3 -m pip install --upgrade pip
py -3 -m pip install -r requirements.txt
py -3 train_model.py
py -3 train_voice_model.py
cd ..
```

**Every time — three terminals, leave them open**

Terminal 1 (ML):

```powershell
cd "C:\Users\YOUR_NAME\Desktop\ai_careerforge\ml_service"
py -3 app.py
```

Terminal 2 (API):

```powershell
cd "C:\Users\YOUR_NAME\Desktop\ai_careerforge\backend"
node server.js
```

Terminal 3 (UI):

```powershell
cd "C:\Users\YOUR_NAME\Desktop\ai_careerforge"
npm run dev
```

Open **http://127.0.0.1:5173** in Chrome. Register with email and password.

### macOS / Linux

**Once**

```bash
cd ~/Desktop/ai_careerforge

npm install
cd backend && npm install && cp .env.example .env && cd ..
cd ml_service
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
python3 train_model.py
python3 train_voice_model.py
cd ..
```

**Every time — three terminals**

```bash
cd ~/Desktop/ai_careerforge/ml_service && python3 app.py
```

```bash
cd ~/Desktop/ai_careerforge/backend && node server.js
```

```bash
cd ~/Desktop/ai_careerforge && npm run dev
```

Open http://127.0.0.1:5173

### Check

```powershell
curl http://127.0.0.1:5001/health
curl http://127.0.0.1:5000/api/health
```

Both should return `"ok": true`.

Full architecture, diagrams, optional MySQL/Google setup, and troubleshooting: **DOCUMENTATION.md** and **CareerForge_Documentation.docx**.
