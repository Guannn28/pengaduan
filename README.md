<div align="center">

# 🏫 Complaint

**Web-Based Student Complaint Platform with an AI Chatbot Assistant**

Built with React, Vite, Node.js, Express.js, and MongoDB

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](#license)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232a)](#)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)](#)

</div>

---

## 📖 About the Project

Complaint is a full-stack platform designed to help students submit complaints to their school in a structured, secure, and easy-to-track way.

Students can request an account, submit complaints with supporting evidence, monitor complaint progress, and receive initial assistance through a chatbot assistant. Administrators can verify accounts, manage complaints, update handling statuses, and view complaint statistics.

---

## ✨ Key Features

### 👤 Student Features

- Request a student account.
- Log in using a username and password.
- Submit complaints directly or through the chatbot.
- Upload photos or other supporting evidence.
- Select complaint categories and urgency levels.
- Monitor complaint statuses.
- View complaint details and history.

### 🛠️ Admin Features

- Log in as an administrator.
- Approve or remove student account requests.
- Create student accounts directly.
- View and manage all complaints.
- Update complaint statuses.
- View and download complaint evidence.
- Delete complaints.
- Export complaint data to Excel.
- View complaint statistics and summaries.

### 🤖 Chatbot Assistant

- Help students organize complaint information.
- Collect the incident chronology, location, time, involved parties, witnesses, and the reporter's expectations.
- Support evidence uploads during the conversation.
- Create a draft or save a complaint after the information is complete.
- Integrate with an n8n webhook.

### 🔐 Security and Storage

- Token-based authentication.
- Role-based access control for students and administrators.
- Access validation on protected endpoints.
- Evidence storage through Cloudinary or local storage, depending on the configuration.
- CORS configuration to restrict frontend origins.

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript, Lucide React |
| **Backend** | Node.js 20+, Express.js |
| **Database** | MongoDB, MongoDB Node.js Driver |
| **Authentication** | Token-based authentication, role-based access |
| **File Upload** | Multer, Cloudinary |
| **Chatbot** | n8n Webhook |
| **Export** | ExcelJS |

---

## 📁 Project Structure

```text
pengaduan/
├── backend/
│   ├── config/              # Database and environment configuration
│   ├── controllers/         # Authentication and complaint logic
│   ├── middleware/          # Authentication, upload, and error handling
│   ├── models/              # MongoDB models
│   ├── routes/              # API endpoints
│   ├── utils/               # Security, serializers, and storage helpers
│   ├── app.js               # Express application configuration
│   └── server.js            # Backend entry point
│
├── client/
│   ├── public/              # Logo and static assets
│   └── src/
│       ├── components/      # Admin, student, and shared UI components
│       ├── context/         # Toast and global context
│       ├── pages/           # Student and admin pages
│       ├── services/        # API client
│       └── App.jsx          # Frontend application root
│
├── uploads/                 # Local file storage when enabled
├── package.json
└── README.md
```

---

## 🧩 Application Modules

- User login and authentication
- Student account requests
- Student dashboard
- Admin dashboard
- Complaint management
- Complaint categories and urgency levels
- Complaint evidence uploads
- Chatbot assistant
- Complaint statistics
- Complaint export to Excel

---

## 🔌 API Endpoints

All main endpoints use the `/api` prefix.

### Authentication and Accounts

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Submit a student account request |
| `POST` | `/api/login` | Log in as a student or administrator |
| `GET` | `/api/me` | Get the currently authenticated user |
| `GET` | `/api/account-requests` | View student account requests (admin) |
| `GET` | `/api/admin/users` | View student accounts (admin) |
| `POST` | `/api/admin/users` | Create a student account (admin) |
| `DELETE` | `/api/account-requests/:id` | Delete an account request (admin) |
| `DELETE` | `/api/admin/users/:id` | Delete a student account (admin) |

### Complaints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/complaints` | Get complaints based on the user's role |
| `POST` | `/api/complaints` | Create a new complaint |
| `PATCH` | `/api/complaints/:id/status` | Update a complaint status (admin) |
| `GET` | `/api/complaints/:id/evidence/download` | Download complaint evidence (admin) |
| `DELETE` | `/api/complaints/:id` | Delete a complaint (admin) |
| `GET` | `/api/complaints/export/excel` | Export complaint data to Excel (admin) |
| `GET` | `/api/stats` | Get complaint statistics (admin) |
| `GET` | `/api/health` | Check API health |

### Chatbot

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chatbot/message` | Send a message to the chatbot assistant |
| `POST` | `/api/chatbot/submit` | Save complaint data from the chatbot |
| `GET` | `/api/chatbot/draft` | Get the active chatbot draft |
| `POST` | `/api/chatbot/upload-evidence` | Upload evidence to the chatbot draft |
| `DELETE` | `/api/chatbot/evidence` | Delete evidence from the chatbot draft |

---

## 🗃️ Main Data Models

### `users`

Stores user data, usernames, roles, and student account status.

### `accountRequests`

Stores student account requests and supporting documents.

### `complaints`

Stores complaint categories, descriptions, urgency, locations, incident times, statuses, reporter data, and evidence.

### `chatbotDrafts`

Stores temporary evidence while a student is preparing a complaint through the chatbot.

---

## 🚀 Installation and Usage

Make sure **Node.js 20+** is installed and **MongoDB** is running.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pengaduan
```

### 2. Install Dependencies

```bash
npm install
cd backend
npm install
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables

Create `backend/.env` using the following template:

```env
HOST=0.0.0.0
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=complaints_db

ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace_with_a_secure_password

# Optional: Cloudinary evidence storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: n8n chatbot integration
N8N_CHATBOT_WEBHOOK_URL=
N8N_CHATBOT_TIMEOUT_MS=45000
```

### 4. Run in Development Mode

From the project root:

```bash
npm run dev
```

The frontend is available at `http://localhost:5173` and the backend runs at `http://localhost:4000`.

### 5. Run Services Separately

```bash
# Terminal 1 - backend
cd backend
npm run dev

# Terminal 2 - frontend
cd client
npm run dev
```

---

## 📦 Production Build

```bash
npm run build
npm start
```

The build command generates the production frontend in `client/dist`. The backend serves the built frontend when the directory is available.

---

## 📝 Configuration Notes

- `CLIENT_ORIGIN` defines the frontend origin allowed by CORS.
- When Cloudinary is not configured, the application can use local file storage according to the upload configuration.
- `N8N_CHATBOT_WEBHOOK_URL` is required for the chatbot to communicate with an n8n workflow.
- Do not commit `.env` files to the repository.
- Use a strong admin password and secure secrets in production.

---

## 🗺️ Future Improvements

- [ ] Real-time notifications for complaint status changes
- [ ] Complaint handling activity history
- [ ] More advanced complaint filtering and search
- [ ] Additional roles for homeroom teachers or counselors
- [ ] Automated frontend and backend testing
- [ ] Production deployment with additional security configuration
- [ ] Improved analytics and data visualization

---

## 🎯 Project Purpose

Kaduin Lu was built to demonstrate:

- Full-stack web application development
- REST API and role-based authentication
- MongoDB database management
- Complaint evidence upload and management
- Admin dashboards and data visualization
- Chatbot integration with workflow automation

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Kaduin Lu Development Team**

**Tech:** React · Vite · Node.js · Express.js · MongoDB · Cloudinary · n8n
