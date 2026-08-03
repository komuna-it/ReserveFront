@echo off
echo "starting generating ssl cert for frontend"

call mkcert -install
if not exist "certs" mkdir certs
call mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

echo "done, cert created in certs/"
pause