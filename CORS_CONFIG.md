# CORS Configuration

## Overview
The backend is configured with CORS (Cross-Origin Resource Sharing) to allow frontend requests from different origins.

## Development Mode
In development mode (`NODE_ENV=development`), the following origins are allowed:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite alternative)
- `http://localhost:3000` (Backend)
- `http://localhost:3001` (Alternative port)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`

For development, all localhost origins are allowed for flexibility.

## Production Mode
In production mode, you need to set the `ALLOWED_ORIGINS` environment variable with comma-separated frontend URLs.

### Example .env for Production:
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Multiple Origins:
```env
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

## Allowed Methods
- GET
- POST
- PUT
- DELETE
- OPTIONS
- PATCH

## Allowed Headers
- Content-Type
- Authorization
- X-Requested-With

## Credentials
CORS is configured to allow credentials (cookies, authorization headers), which is required for JWT authentication.

## Testing CORS
You can test CORS configuration using:

```bash
# Test from browser console or Postman
fetch('http://localhost:3000/api/warehouses', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
})
```

## Troubleshooting

### CORS Error in Development
1. Make sure `NODE_ENV=development` in your `.env` file
2. Check that your frontend URL matches one of the allowed origins
3. Restart the backend server after changing CORS settings

### CORS Error in Production
1. Set `ALLOWED_ORIGINS` in your production `.env` file
2. Include the exact frontend domain (with protocol: https://)
3. For multiple domains, separate with commas
4. Restart the server after updating

## Vite Proxy (Development)
If you're using Vite proxy in development (recommended), CORS won't be an issue because requests appear as same-origin. However, the backend CORS configuration ensures it works even without the proxy.

## Notes
- The backend allows credentials, so make sure your frontend also sends credentials if needed
- Preflight OPTIONS requests are automatically handled
- CORS errors will show in browser console if configuration is incorrect
