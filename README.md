# String Arcade Backend

The backend system for the String Arcade platform, a crypto-integrated gaming application. This application serves as the core infrastructure for managing users, game logic, wallet integrations (Solana, TON, Ethereum), and administrative functions.

## 📖 Project Overview

String Arcade Backend is a Node.js/Express application designed to power a modern gaming platform. It provides a robust API for:

- User authentication And Security (Email, 2FA, Wallet Connect, Telegram).
- Real-time game history and leaderboards.
- Crypto wallet management and transactions.
- Admin dashboard for content and user management.
- Referral and reward systems.

The architecture handles interaction between the frontend, blockchain networks, and the database, ensuring secure transaction processing and data integrity.

## 🛠 Technology Stack

### Runtime & Frameworks

- **Node.js**: The core runtime environment.
- **Express.js**: Web framework used for routing, middleware management, and API handling.
- **Config**: Configuration management for different deployment environments (`config` package).

### Database

- **MongoDB**: Primary database for storing user data, game history, and application state.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB schema validation and query building.
- **Mongoose Paginate**: Used for robust pagination on list endpoints.

### Authentication & Security

- **JWT (JSON Web Tokens)**: Secure token-based authentication for user sessions.
- **Bcrypt.js**: Library for hashing and securing user passwords.
- **Speakeasy**: Implements Two-Factor Authentication (2FA) using TOTP (Time-Based One-Time Password).
- **Helmet/Cors**: Security headers and CORS configuration (implied/visible in middleware).

### Blockchain Integration

- **@solana/web3.js**: Interaction with the Solana blockchain.
- **@ton/core**: TON blockchain core utilities.
- **Ethers.js & Ethereumjs-wallet**: Ethereum network interaction and wallet management.
- **Bip39**: Mnemonic generation for wallet creation.

### Utilities & Services

- **Swagger (OpenAPI)**: API documentation and testing interface.
- **Cloudinary**: Cloud storage for image uploads (Profile pics, banners).
- **AWS S3**: Setup for S3 interaction (`@aws-sdk/client-s3`).
- **Nodemailer**: Email service integration (configured for Office365).
- **Telegraf**: Integration with Telegram Bot API.
- **Node-cron**: Task scheduling for background jobs.
- **Socket.io/WebSocket**: Real-time communication (Dependencies `websocket` listed).

## 🏗 Architecture Overview

The application follows a **Model-Controller-Route** pattern with a centralized Server class setup.

- **Entry Point**: `index.js` uses `babel-register` and imports `server/index.js`.
- **Server Setup**: `server/common/server.js` initializes the Express app, configures middleware (CORS, BodyParser, Morgan), connects to MongoDB, and binds the router.
- **Routes**: `server/routes.js` acts as the central hub, dispatching requests to specific modules (e.g., `/api/v1/user`, `/api/v1/admin`).
- **Controllers**: Located in `server/api/v1/controllers/`, these contain the business logic.
- **Models**: Located in `server/models/`, defining the Mongoose schemas.
- **Middleware**: Custom authentication and error handling middleware.

## 📂 Project Structure

```
root/
├── config/                 # Configuration files (local, production)
├── server/
│   ├── api/                # API Endpoints
│   │   └── v1/
│   │       └── controllers/ # Business logic grouped by feature (user, admin, game...)
│   ├── common/             # Shared server setup (Express setup, DB connect)
│   ├── models/             # Mongoose schemas (User, Game, Transaction...)
│   ├── helper/             # Utility functions (Auth, Uploads, ErrorHandler)
│   ├── enums/              # Application constants
│   ├── local.json          # Local environment config
│   ├── routes.js           # Central route definitions
│   └── index.js            # App initialization logic
├── .env                    # Environment variables
├── api.yaml                # Swagger API definition
├── package.json            # Dependencies and scripts
└── index.js                # Application entry point
```

## ✨ Features

- **User System**: Signup, Login, Profile Management, Avatar Uploads.
- **Authentication**:
  - Standard Email/Password.
  - OTP verification.
  - Social Login.
  - **Telegram InitData** verification.
  - **2FA** using Google Authenticator.
- **Wallet Integration**:
  - Connect Wallet (Solana/EVM).
  - Withdraw functionality.
  - Real-time price tracking (CoinGecko).
- **Game Mechanics**:
  - Game History logging.
  - Leaderboards.
  - Ticket balance management.
- **Rewards System**:
  - Daily Rewards.
  - Referral System (Tracking referrer/referee).
  - Ad-based rewards.
- **Admin Panel**:
  - User management (Block/Unblock).
  - CMS (Static content, FAQ, Banners).
  - Analytics/Activity logs.
- **Support**: Ticket-based support system ("Contact Us").

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (Running instance or Atlas URI)
- npm or yarn

### Steps

1.  **Clone the repository**:

    ```bash
    git clone <repository_url>
    cd Backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    # or
    npm install --legacy-peer-deps # If version conflicts occur
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory (based on `.env` example if available, or the list below).

4.  **Run Development Server**:
    ```bash
    npm start
    ```
    This uses `nodemon` to watch for file changes.

## 🌍 Environment Variables

The application relies on the following environment variables in `.env`:

| Variable                | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `NODE_ENV`              | Environment mode (e.g., `production` or `development`). |
| `port`                  | Port the server listens on (default: `53004`).          |
| `hostAddress`           | Base URL of the application.                            |
| `databaseURI`           | MongoDB connection string.                              |
| `jwtsecret`             | Secret key for signing JWT tokens.                      |
| `Bot_Token`             | Token for the Telegram Bot integration.                 |
| `SOLANA_RPC_URL`        | RPC Endpoint for Solana network.                        |
| `Gas_Fee_Wallet_Key`    | Private key for the wallet handling gas fees.           |
| `AWS_ACCESS_KEY_ID`     | AWS Credentials for S3.                                 |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key for S3.                                  |
| `S3_BUCKET_NAME`        | S3 Bucket name.                                         |
| `cloudinarycloud_name`  | Cloudinary config.                                      |
| `cloudinaryapi_key`     | Cloudinary API Key.                                     |
| `cloudinaryapi_secret`  | Cloudinary Secret.                                      |
| `nodemaileremail`       | Email address for sending system emails.                |
| `nodemailerpassword`    | Password for the email account.                         |
| `walletCredmnemonic`    | Mnemonic for the master/admin wallet.                   |

_Note: Sensitive keys in `production.json` or `.env` should be rotated and secured._

## 📚 API Documentation

The application includes integrated Swagger documentation.

- **Access URL**: `/api-docs` (e.g., `http://localhost:53004/api-docs`) provides an interactive UI to test endpoints.
- **Specification**: Defined in `api.yaml`.

### Key Endpoints Overview

- **Auth**: `/api/v1/user/signUp`, `/api/v1/user/login`, `/api/v1/user/verify2Falogin`
- **Wallet**: `/api/v1/solana/walletConnect`, `/api/v1/user/withdraw`
- **Game**: `/api/v1/game/playGame`, `/api/v1/user/getLeaderBoard`
- **Admin**: `/api/v1/admin/getAllUsers`, `/api/v1/admin/addBanner`

## 🚦 Application Flow

1.  **Initialization**: `index.js` bootstraps `ExpressServer`. It connects to MongoDB via `mongoose` and sets up Swagger.
2.  **Request Handling**: Requests proceed through standard middleware (BodyParser, CORS) -> `routes.js`.
3.  **Security Check**: Protected routes pass through middleware like `auth.verifyToken` or `auth.verifyInitData` (for Telegram).
4.  **Controller Action**: Controllers execute logic, potentially interacting with `models` (DB) or external services (Blockchain RPC, Cloudinary).
5.  **Response**: JSON responses are sent back to the client.

## 📜 Scripts

Defined in `package.json`:

- `npm start`: Runs `nodemon index.js`. Starts the server with hot-reloading enabled.
- `npm test`: Currently a placeholder (echoes error).

## 🔒 Security

- **Input Validation**: Implicitly handled via Mongoose schemas and controller logic.
- **Authentication**:
  - **Session**: State-less JWT authentication.
  - **Header**: Tokens expected in `Authorization` header.
- **Data Protection**:
  - Passwords hashed with `bcryptjs`.
  - Sensitive wallet keys loaded from env.
- **CORS**: Configured in `server.js` to allow specific origins (e.g., `stringarc8.io` domains).

## 🐛 Error Handling & Logging

- **Logging**: Uses `morgan` ("dev" mode) for HTTP request logging.
- **Error Handling**: `apiErrorHandler` middleware (in `helper/apiErrorHandler`) intercepts processing errors and formats the response.
