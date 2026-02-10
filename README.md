# String Arcade Backend

The **String Arcade Backend** is a robust, scalable server-side application designed to power a modern gaming and rewards platform. It provides a comprehensive API for user management, game history tracking, leaderboard systems, daily rewards, and tasks. A key feature of the platform is its integration with the **Solana blockchain** for crypto-based economy features, including wallet management and token transactions.

The system is built with **Node.js** and **Express**, using **MongoDB** for data persistence and **Swagger** for API documentation. It features a modular architecture with clear separation of concerns between controllers, models, and services.

## 🏗 Project Architecture

The application follows a standard MVC (Model-View-Controller) pattern, adapted for a RESTful API service.

### Technical Stack

- **Runtime Environment:** Node.js (with Babel for ES6+ support)
- **Web Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Blockchain Integration:** `@solana/web3.js`, `@solana/spl-token`
- **Authentication:** JWT (JSON Web Tokens)
- **Documentation:** Swagger / OpenAPI
- **External APIs:** CoinGecko (Pricing), Cloudinary (Media Assets), Telegram Bot API

### Key Modules

- **User Management:** Handles registration, authentication, referral systems, and user profiles.
- **Game Engine:** Manages game categories, metadata, and records gameplay history/scoring.
- **Economy System:**
  - **Wallet:** Internal wallet logic for user balances.
  - **Solana Integration:** Facilitates deposits and interactions with the Solana blockchain.
  - **Transactions:** Comprehensive logs of all financial movements (rewards, withdrawals, etc.).
- **Engagement & Rewards:**
  - **Daily Rewards:** Configurable login bonuses.
  - **Tasks:** User tasks system for earning extra rewards.
  - **Boosters:** Item/perk system to enhance gameplay or earnings.
- **Admin Dashboard:** Dedicated API endpoints for administrators to manage users, games, banners, and system settings.
- **Infrastructure:** Includes centralized error handling, logging, and environment-based configuration.

## 📂 Codebase Organization

The repository is structured to separate configuration, core logic, and assets:

```text
├── config/                 # Environment-specific configuration (database, keys, etc.)
├── server/
│   ├── api/v1/controllers/ # Request handlers grouped by feature (User, Game, Solana, Admin, etc.)
│   ├── common/             # Core server setup (Express app, middleware configuration)
│   ├── models/             # Mongoose schemas defining the data structure
│   ├── helper/             # Utility functions (Auth, Error Handling, Validators)
│   ├── bot.js              # Telegram bot integration logic
│   ├── index.js            # Server entry point
│   └── routes.js           # Main API route definitions
├── api.yaml                # OpenAPI/Swagger specification
├── assets/                 # Static assets (images, banners)
└── index.js                # Application bootstrapper
```

---

## 📅 Day-Wise GitHub Push Planner (Feature Branch Workflow)

This plan outlines a realistic 16-day schedule to push this project to GitHub using a professional Feature Branch Workflow. This approach ensures code stability and easier review.

**Workflow per Day:**

1.  `git checkout -b feature/branch-name`
2.  (Work on files)
3.  `git add .`
4.  `git commit -m "feat: description of work"`
5.  `git push origin feature/branch-name`
6.  (Pull Request / Review)
7.  `git checkout main`
8.  `git merge feature/branch-name`
9.  `git branch -d feature/branch-name`
10. `git push origin main`

### Phase 1: Foundation & Setup

#### Day 1: Project Initialization

- **Goal:** Set up the repository, gitignore, and dependency management.
- **Branch:** `chore/init-project`
- **Files:** `package.json`, `.gitignore`, `.babelrc`, `.env.example`, `index.js` (root).
- **Git Commands:**
  ```bash
  git checkout -b chore/init-project
  git add package.json .gitignore .babelrc index.js
  git commit -m "chore: init project structure and dependencies"
  git push origin chore/init-project
  # Merge to main
  ```

#### Day 2: Configuration & Database Layer

- **Goal:** Implement environment configuration and database connection logic.
- **Branch:** `feat/db-config`
- **Files:** `config/`, `server/common/server.js` (DB connection part), `server/index.js`.
- **Git Commands:**
  ```bash
  git checkout -b feat/db-config
  git add config/ server/common/server.js server/index.js
  git commit -m "feat: add database connection and environment config"
  # ...
  ```

### Phase 2: Core Logic & Auth

#### Day 3: Data Models (Part 1 - Core)

- **Goal:** Define the essential Mongoose schemas.
- **Branch:** `feat/core-models`
- **Files:** `server/models/user.js`, `server/models/transaction.js`, `server/models/adminActivity.js`.
- **Git Commands:**
  ```bash
  git checkout -b feat/core-models
  git add server/models/user.js server/models/transaction.js
  git commit -m "feat: add user and transaction models"
  # ...
  ```

#### Day 4: Utilities & Middleware

- **Goal:** Add authentication middleware, error handling, and helper functions.
- **Branch:** `feat/utils-middleware`
- **Files:** `server/helper/auth.js`, `server/helper/apiErrorHandler.js`, `server/helper/`.
- **Git Commands:**
  ```bash
  git checkout -b feat/utils-middleware
  git add server/helper/
  git commit -m "feat: implement auth middleware and global error handler"
  # ...
  ```

#### Day 5: User Authentication System

- **Goal:** Implement user signup, login, and profile management endpoints.
- **Branch:** `feat/auth-module`
- **Files:** `server/api/v1/controllers/user/`, `server/routes.js` (User routes).
- **Git Commands:**
  ```bash
  git checkout -b feat/auth-module
  git add server/api/v1/controllers/user/
  git commit -m "feat: implement user authentication and profile management"
  # ...
  ```

### Phase 3: Game & Engagement

#### Day 6: Game Engine & Categories

- **Goal:** Add support for game categories and game metadata.
- **Branch:** `feat/game-engine`
- **Files:** `server/models/game.js`, `server/models/category.js`, `server/api/v1/controllers/game/`, `server/api/v1/controllers/category/`.
- **Git Commands:**
  ```bash
  git checkout -b feat/game-engine
  git add server/models/game.js server/api/v1/controllers/game/
  git commit -m "feat: add game management and categories"
  # ...
  ```

#### Day 7: Game History & Leaderboards

- **Goal:** Track gameplay history and generate leaderboards.
- **Branch:** `feat/leaderboards`
- **Files:** `server/models/gameHistory.js`, `server/models/leaderBoard.js`.
- **Git Commands:**
  ```bash
  git checkout -b feat/leaderboards
  git add server/models/leaderBoard.js server/models/gameHistory.js
  git commit -m "feat: implement game history trekking and leaderboards"
  # ...
  ```

#### Day 8: Task System & Rewards

- **Goal:** Implement the logic for user tasks and daily reward streaks.
- **Branch:** `feat/tasks-rewards`
- **Files:** `server/models/Tasks.js`, `server/models/DailyReward*.js`, `server/api/v1/controllers/Tasks/`, `server/api/v1/controllers/Dailyrewards/`.
- **Git Commands:**
  ```bash
  git checkout -b feat/tasks-rewards
  git add server/models/DailyRewardPlan.js server/api/v1/controllers/Tasks/
  git commit -m "feat: add daily rewards and user task system"
  # ...
  ```

### Phase 4: Economy & Blockchain

#### Day 9: Boosters & Ads

- **Goal:** Add monetization features: boosters (item store) and ad integration.
- **Branch:** `feat/boosters-ads`
- **Files:** `server/models/Booster.js`, `server/models/ads.js`, `server/api/v1/controllers/Boosters/`, `server/api/v1/controllers/ads/`.
- **Git Commands:**
  ```bash
  git checkout -b feat/boosters-ads
  git add server/api/v1/controllers/Boosters/ server/api/v1/controllers/ads/
  git commit -m "feat: implement booster shop and ad tracking"
  # ...
  ```

#### Day 10: Wallet & Withdrawal Logic

- **Goal:** Implement internal wallet settings and withdrawal processing.
- **Branch:** `feat/wallet-system`
- **Files:** `server/models/WithdrawalSettings.js`, `server/common/enums/`.
- **Git Commands:**
  ```bash
  git checkout -b feat/wallet-system
  git add server/models/WithdrawalSettings.js
  git commit -m "feat: setup wallet configurations and withdrawal settings"
  # ...
  ```

#### Day 11: Solana Blockchain Integration

- **Goal:** Integrate Solana Web3 connection for checking balances and transactions.
- **Branch:** `feat/solana-integration`
- **Files:** `server/api/v1/controllers/solana/`, dependencies related to `@solana`.
- **Git Commands:**
  ```bash
  git checkout -b feat/solana-integration
  git add server/api/v1/controllers/solana/
  git commit -m "feat: integrate solana web3 for crypto transactions"
  # ...
  ```

### Phase 5: Admin & Polish

#### Day 12: Admin Dashboard - Core

- **Goal:** Setup admin authentication and basic settings.
- **Branch:** `feat/admin-core`
- **Files:** `server/models/adminSettings.js`, `server/api/v1/controllers/admin/routes.js`.
- **Git Commands:**
  ```bash
  git checkout -b feat/admin-core
  git add server/api/v1/controllers/admin/
  git commit -m "feat: setup admin routes and settings"
  # ...
  ```

#### Day 13: Admin Management Tools

- **Goal:** Admin tools for managing banners, static content, and notifications.
- **Branch:** `feat/admin-tools`
- **Files:** `server/api/v1/controllers/banner/`, `server/api/v1/controllers/notification/`, `server/api/v1/controllers/static/`.
- **Git Commands:**
  ```bash
  git checkout -b feat/admin-tools
  git add server/api/v1/controllers/banner/
  git commit -m "feat: add admin management for banners and content"
  # ...
  ```

#### Day 14: API Documentation (Swagger)

- **Goal:** Finalize and verify the Swagger API documentation.
- **Branch:** `docs/swagger`
- **Files:** `api.yaml`, `server/common/server.js` (Swagger config section).
- **Git Commands:**
  ```bash
  git checkout -b docs/swagger
  git add api.yaml
  git commit -m "docs: finalize swagger api definition"
  # ...
  ```

#### Day 15: Telegram Bot Integration

- **Goal:** Connect the Telegram bot logic.
- **Branch:** `feat/telegram-bot`
- **Files:** `server/bot.js`.
- **Git Commands:**
  ```bash
  git checkout -b feat/telegram-bot
  git add server/bot.js
  git commit -m "feat: integrate telegram bot"
  # ...
  ```

#### Day 16: Final Polish & Deployment

- **Goal:** Clean up logs, final configuration checks, and prep for deployment.
- **Branch:** `chore/release-prep`
- **Files:** `assets/`, any remaining logic in `server/`, final `README.md` update.
- **Git Commands:**
  ```bash
  git checkout -b chore/release-prep
  git add assets/
  git commit -m "chore: final polish and asset upload"
  git push origin chore/release-prep
  # Merge and Tag release
  git tag v1.0.0
  git push origin v1.0.0
  ```
