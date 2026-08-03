#!/bin/bash
echo "starting generating ssl cert for frontend"

mkcert -install
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

echo "done, cert created in certs/"