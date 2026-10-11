@echo off
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo Python was not found. Install Python 3 and run: pip install -r requirements.txt
  exit /b 1
)
echo Training adaptive question model (1500+ row dataset)...
python train_adaptive_questions.py --regenerate --rows 1500
python app.py
