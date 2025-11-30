# Work Pulse

A comprehensive MERN stack application for managing employee attendance, featuring role-based access for Employees and Managers.

## 🚀 Features

### For Employees
- **Dashboard**: View daily status, monthly summary, and total hours.
- **Quick Actions**: One-click Check-In and Check-Out.
- **History**: Calendar view of attendance with color-coded statuses (Present, Absent, Late, Half-Day).
- **Profile**: View and update personal details.

### For Managers
- **Dashboard**: Overview of total employees, daily attendance stats, and absent list.
- **Charts**: Visual trends for weekly attendance and department-wise distribution.
- **Reports**: Advanced filtering by date and employee, with CSV export capability.
- **Team Calendar**: View attendance status for the entire team.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB instance (Local or Atlas)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Tap
    ```

2.  **Install Server Dependencies**
    ```bash
    cd server
    npm install
    ```

3.  **Install Client Dependencies**
    ```bash
    cd ../client
    npm install
    ```

## ⚙️ Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## ▶️ How to Run

1.  **Start the Backend Server**
    ```bash
    cd server
    npm start
    ```
    The server will run on `http://localhost:5000`.

2.  **Start the Frontend Application**
    ```bash
    cd client
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📸 Screenshots

### Manager Dashboard
![Manager Dashboard 1](./Manager%20Dashboard%20screenshots/Manager%20Dashboard%201.png)
![Manager Dashboard 2](./Manager%20Dashboard%20screenshots/Manager%20Dashboard%202.png)
![Attendance Report](./Manager%20Dashboard%20screenshots/Attendance%20Report.png)
![Team Calendar](./Manager%20Dashboard%20screenshots/Attendance%20History%20(Calendar).png)

### Employee Dashboard
![Employee Dashboard](./Employee%20Screenshots/Employee%20Dashboard.png)
![Attendance History](./Employee%20Screenshots/Attendance%20History.png)

### Authentication
![Login Page](./Manager%20Dashboard%20screenshots/Login%20Page.png)
![Register Page](./Employee%20Screenshots/Register%20Page%20for%20New%20Employee.png)

## 🎨 UI/UX
The application features a premium "Midnight Blue" and "Slate" design system with glassmorphism effects and responsive layouts.
