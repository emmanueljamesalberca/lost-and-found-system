## Smart Campus Lost & Found System

A containerized full-stack web app, that digitalizes a campus' lost and found management. Built for the CS121 Capstone Project (aligning with UN's SDG 11 and 16), this system enables users to report, search, and track either lost or found items efficiently through a simple comprehensive web interface
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## Demo 
https://github.com/user-attachments/assets/577d0c35-f1ce-46a0-b445-1954ceb294bc

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## System Architecture
<img width="1265" height="712" alt="image" src="https://github.com/user-attachments/assets/1d9d201d-b7ac-4056-84ac-08d880c907de" />

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🐳 Quick Start (Dockerized Setup)

1. Clone Repository

git clone https://github.com/emmanueljamesalberca/lost-and-found-system.git
cd lost-and-found-system

2. Environment Setup

cp .env.example .env

3️. Run All Services

docker compose up -d

4️. Access the System

5️.Stop Containers
docker compose down
or
run-lostfound.bat  # start & open browser
stop-lostfound.bat # stop containers

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
📂 Project Structure

System Lost and Found/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/items.routes.js
│   │   └── middleware/upload.js
│   ├── db.js
│   ├── Dockerfile
│   ├── package.json / package-lock.json
│   └── uploads/
├── web/
│   ├── Dockerfile
│   └── nginx.conf
├── index.html / style.css / script.js
├── LOSTFOUND.sql
├── docker-compose.yml
├── run-lostfound.bat / stop-lostfound.bat
├── .env.example / .gitignore / .dockerignore
└── README.md

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# Key Features
- Report Lost or Found ItemsSubmit forms with item details and optional image uploads.
- Search & Filter ItemsReal-time search on both lost and found sections.
- Image Upload & PreviewLocal preview before submission using FileReader().
- Status Management Mark items as found or returned directly from the interface.
- Persistent StorageMySQL data and uploads persist even when containers are stopped.
- One-Command DeploymentEntire system deployable with Docker Compose in seconds.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🧱 Backend Design Notes

Database Connection: uses MySQL2 with async connection pooling (db.js).
File Uploads: managed by Multer (upload.js) with validation and unique file naming.
Middleware: CORS, JSON parsing, request logging (Morgan).
Error Handling: consistent 4xx/5xx responses with JSON error payloads.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🌍 Sustainable Development Goals (SDG)
This project aligns with:

SDG 11 – Sustainable Cities & Communities: Promotes safer, organized, and tech-enabled campus spaces.
SDG 16 – Peace, Justice & Strong Institutions: Builds transparent systems for accountability and lost-item recovery.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
