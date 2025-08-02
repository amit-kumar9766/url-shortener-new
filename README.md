# URL Shortener API

A simple URL shortening service built with Node.js, Express, and PostgreSQL.

## Features

- Shorten long URLs to short codes
- Custom short codes support
- URL expiration dates
- Password protection for URLs
- User authentication with API keys
- Batch URL shortening (enterprise users)
- Soft delete functionality

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Testing**: Jest, Supertest

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_postgres_connection_string
   PORT=3000
   ```

3. **Database setup**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

4. **Start server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
All API requests require an `api_key` in the request headers for authentication.

### 1. Welcome Endpoint
- **GET** `/` - Welcome message
- **Response**: Simple welcome text

### 2. URL Management

#### Get Last 10 URLs
- **GET** `/api/lastUrls`
- **Description**: Retrieve the 10 most recently shortened URLs
- **Response**: Array of URL objects with `originalUrl`, `shortCode`, and `createdAt`

#### Shorten a URL
- **POST** `/api/urls/shorten`
- **Headers**: `api_key` (required)
- **Body**:
  ```json
  {
    "url": "https://example.com/very-long-url",
    "customCode": "optional-custom-code",
    "expiryDate": "2024-12-31T23:59:59Z"
  }
  ```
- **Response**: `{ "shortUrl": "generated-short-code" }`

#### Batch URL Shortening
- **POST** `/shorten/batch`
- **Headers**: `api_key` (required, enterprise users only)
- **Body**:
  ```json
  {
    "urls": [
      {
        "url": "https://example1.com",
        "expiryDate": "2024-12-31T23:59:59Z"
      },
      {
        "url": "https://example2.com"
      }
    ]
  }
  ```
- **Response**: Array of shortened URLs

#### Redirect to Original URL
- **GET** `/api/urls/redirect`
- **Query Parameters**: `code` (short code)
- **Description**: Redirects to the original URL
- **Response**: 302 redirect to original URL

#### Delete a URL
- **DELETE** `/api/urls/:code`
- **Headers**: `api_key` (required)
- **Description**: Soft delete a URL (marks as deleted but keeps in database)
- **Response**: Success message

#### Update Short Code
- **PUT** `/url/:shortUrl`
- **Headers**: `api_key` (required)
- **Body**: New short code
- **Description**: Update the short code for an existing URL
- **Response**: Updated URL object

#### Get User URLs
- **GET** `/urls`
- **Headers**: `api_key` (required)
- **Description**: Get all URLs created by the authenticated user
- **Response**: Array of user's URLs

### Error Responses
All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (missing API key)
- `403` - Forbidden (invalid API key or insufficient permissions)
- `404` - Not Found
- `409` - Conflict (custom code already exists)
- `500` - Internal Server Error

## Testing

```bash
npm test
```

## Project Structure

```
├── config/          # Database configuration
├── controllers/     # Route handlers
├── migrations/      # Database migrations
├── models/          # Sequelize models
├── routes/          # API routes
├── seeders/         # Database seeders
├── tests/           # Test files
├── utils/           # Utility functions
└── server.js        # Main server file
``` 