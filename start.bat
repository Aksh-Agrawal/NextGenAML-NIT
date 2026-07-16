@echo off
echo ========================================================
echo  NextGenAML - Startup Script (Windows)
echo ========================================================
echo.

:: Check if .env exists
if not exist .env (
    echo [WARN] .env not found. Copying .env.example...
    copy .env.example .env
    echo [ACTION] Please edit .env and add your GOOGLE_API_KEY, then re-run.
    pause
    exit /b 1
)

echo [1/4] Starting Memgraph via Docker...
docker-compose up -d memgraph
echo        Waiting 10 seconds for Memgraph to initialize...
timeout /t 10 /nobreak > nul

echo.
echo [2/4] Starting FastAPI backend...
start /b cmd /c "python -m uvicorn api.main:app --host 0.0.0.0 --port 8089 --log-level info > logs\api.log 2>&1"
echo        API will be available at http://localhost:8089
echo        Swagger UI:              http://localhost:8089/docs
timeout /t 3 /nobreak > nul

echo.
echo [3/4] Starting Streamlit dashboard...
start /b cmd /c "streamlit run dashboard/app.py --server.port 8501 > logs\streamlit.log 2>&1"
echo        Dashboard at:   http://localhost:8501

echo.
echo [4/4] Opening browser...
timeout /t 4 /nobreak > nul
start http://localhost:8501

echo.
echo ========================================================
echo  System is running!
echo  - Dashboard:  http://localhost:8501
echo  - API:        http://localhost:8089
echo  - API Docs:   http://localhost:8089/docs
echo  - Memgraph:   http://localhost:3000  (Lab UI)
echo ========================================================
echo.
echo To ingest AMLSim data, run in a new terminal:
echo   python ingestion/ingest_amlsim.py --csv_path data/HI-Small_Trans.csv
echo.
echo To train the model, run:
echo   python training/train.py --model line_mvgnn --epochs 50
echo.
pause
