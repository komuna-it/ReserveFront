@echo off
if not exist "certs\fullchain.pem" (
    call setup-cert.bat
)
docker-compose stop frontend
docker-compose rm -f frontend
docker-compose up -d --build frontend
echo "Frontend running securely at https://localhost"
pause
