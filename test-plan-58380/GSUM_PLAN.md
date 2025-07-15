# Implementation Plan: User Registration

## 1. Overview

This plan details the implementation of a new user registration feature for the `test-plan-58380` Express.js application. The core of this task is to create a secure `POST /register` endpoint that allows new users to create an account.

The approach involves:
- Creating a new API endpoint: `POST /api/auth/register`.
- Accepting `username` and `password` in the request body.
- Implementing robust input validation.
- Securely hashing passwords using the `bcrypt` library before storage.
- Simulating a user database with an in-memory store for this implementation, with recommendations for future persistent storage.
- Returning a clear success or error message to the client.

## 2. Step-by-Step Implementation Guide

### Step 2.1: Install Dependencies

We need the `bcrypt` library for password hashing. We will also add `express-validator` for robust input validation.

Execute the following command in the project root:
```bash
npm install bcrypt express-validator
```

### Step 2.2: Create a Simulated User Store

For this task, we will use a simple in-memory array to store user data. In a production environment, this should be replaced with a proper database (e.g., PostgreSQL, MongoDB).

**Create new file:** `/Users/jhurray/src/gsum/test-plan-58380/src/data/users.js`

```javascript
// /Users/jhurray/src/gsum/test-plan-58380/src/data/users.js

// In-memory user store for demonstration purposes.
// In a real application, use a database.
const users = [];

export default users;
```

### Step 2.3: Update Authentication Routes

We will modify the existing authentication route file to add the registration logic.

**Modify file:** `/Users/jhurray/src/gsum/test-plan-58380/src/routes/auth.js`

We will add a new route handler for `POST /register`. This handler will perform validation, check for existing users, hash the password, and save the new user.

```javascript
// /Users/jhurray/src/gsum/test-plan-58380/src/routes/auth.js
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import users from '../data/users.js'; // Assuming ES modules based on file structure

const router = Router();
const saltRounds = 10;

// Existing routes...
// router.post('/login', ...);

// --- NEW REGISTRATION ROUTE ---
router.post(
  '/register',
  // Input validation middleware
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  async (req, res) => {
    // 1. Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;

      // 2. Check if user already exists
      const existingUser = users.find(user => user.username === username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken.' });
      }

      // 3. Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 4. "Save" the new user
      const newUser = {
        id: users.length + 1, // Simple ID generation
        username,
        password: hashedPassword,
      };
      users.push(newUser);

      console.log('Registered users:', users); // For debugging

      // 5. Respond with success
      // Avoid sending the password hash back to the client
      res.status(201).json({
        message: 'User registered successfully.',
        user: { id: newUser.id, username: newUser.username },
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);

export default router;
```
*Note: The code above assumes you are using ES Modules (`import`/`export`). If your project uses CommonJS (`require`/`module.exports`), adjust the syntax accordingly.*

### Step 2.4: Integrate Auth Router in Main App File

Ensure the main application file (e.g., `index.js` or `app.js`, which is not listed but assumed to exist) is using this router, likely under a prefix like `/api/auth`.

Example (in `app.js`):
```javascript
import express from 'express';
import authRoutes from './src/routes/auth.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

// ...
```

## 3. Testing Approach

A combination of manual and automated testing is recommended.

### 3.1 Manual Testing

Use a tool like `curl` or Postman to manually test the endpoint.

**Test Case 1: Successful Registration**
- **Request:** `POST /api/auth/register`
- **Body:** `{ "username": "testuser", "password": "password123" }`
- **Expected Response:** `Status 201 Created` with a JSON body like `{ "message": "User registered successfully.", "user": { "id": 1, "username": "testuser" } }`

**Test Case 2: Duplicate Username**
- **Request:** `POST /api/auth/register` (after running the first test)
- **Body:** `{ "username": "testuser", "password": "anotherpassword" }`
- **Expected Response:** `Status 409 Conflict` with `{ "message": "Username already taken." }`

**Test Case 3: Invalid Input (Short Password)**
- **Request:** `POST /api/auth/register`
- **Body:** `{ "username": "newuser", "password": "short" }`
- **Expected Response:** `Status 400 Bad Request` with an error message about the password length.

### 3.2 Automated Integration Tests

For a more robust setup, add integration tests using a framework like `Jest` with `supertest`.

**Example Test File (`tests/auth.test.js`):**
```javascript
import request from 'supertest';
import app from '../src/app'; // Your main Express app

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser_jest',
        password: 'password1234',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully.');
  });

  it('should fail if username is already taken', async () => {
    // First, create the user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplicateuser',
        password: 'password1234',
      });
    
    // Then, try to create it again
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplicateuser',
        password: 'password1234',
      });
    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty('message', 'Username already taken.');
  });
});
```

## 4. Potential Challenges and Solutions

- **Challenge:** In-memory data store is not persistent.
  - **Solution:** This is acceptable for the initial implementation and testing. The plan should be followed by a task to integrate a real database like PostgreSQL or MongoDB. The user data access logic should be abstracted into a service or repository layer to make this transition easier.

- **Challenge:** Security of sensitive data.
  - **Solution:** Passwords are being hashed with `bcrypt`, which is the correct approach. Ensure that environment variables are used for secrets like JWT keys or database credentials, and never commit them to version control.

- **Challenge:** Scalability of user lookup.
  - **Solution:** Searching an array (`users.find`) is O(n). This is fine for a small number of users but will become slow. A database with an index on the `username` column will provide fast O(log n) or O(1) lookups.

## 5. Verification Steps

To confirm the implementation is successful, follow these steps:

1.  **Run the application:** `npm start` (or the relevant script from `package.json`).
2.  **Execute Manual Tests:** Perform the three manual tests outlined in section 3.1 using `curl` or Postman.
3.  **Check Logs:** Verify that the server logs show the expected output, including the "Registered users" debug message, without any errors.
4.  **Verify Persistence (within session):** After registering a user, restart the request to register the *same* user. It should fail with a 409 error, proving the in-memory store is working correctly for the application's lifecycle. (Note: restarting the app will clear the store).
5.  **Run Automated Tests:** If implemented, run the test suite (`npm test`) and ensure all tests pass.
