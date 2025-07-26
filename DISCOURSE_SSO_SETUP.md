# Discourse SSO Setup Guide

This guide explains how to configure Single Sign-On (SSO) between your Node.js website and Discourse forum.

## Overview

The Node.js website acts as the **SSO provider**, and Discourse defers to it for authentication. Users log into the website and are automatically authenticated on Discourse.

## 1. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Set the Discourse SSO secret in `.env`:
   ```env
   DISCOURSE_SSO_SECRET=your_super_secure_sso_secret_key_here
   ```

   **Important**: Use a strong, random secret key and keep it secure!

## 2. Configure Discourse

### Update `app.yml`

Edit your Discourse configuration file (`/var/discourse/containers/app.yml` or similar):

```yaml
env:
  # ... existing configuration ...
  
  # Enable SSO
  DISCOURSE_ENABLE_SSO: true
  DISCOURSE_SSO_URL: https://your-domain.com/sso
  DISCOURSE_SSO_SECRET: your_super_secure_sso_secret_key_here
  
  # Optional: Disable local logins (recommended)
  DISCOURSE_ENABLE_LOCAL_LOGINS: false
```

### Rebuild Discourse

After updating the configuration, rebuild Discourse:

```bash
cd /var/discourse
./launcher rebuild app
```

## 3. How It Works

1. **User visits Discourse** → Discourse redirects to `https://your-domain.com/sso`
2. **User not logged in** → Node.js redirects to login page with SSO parameters
3. **User logs in** → Node.js authenticates and redirects back to Discourse with signed user data
4. **User already logged in** → Node.js immediately redirects to Discourse with user data
5. **Discourse receives user data** → Creates/updates user and logs them in

## 4. SSO Endpoints

The following endpoints are implemented in your Node.js API:

### `GET /sso`
- **Purpose**: Main SSO provider endpoint
- **Parameters**: 
  - `sso`: Base64 encoded payload from Discourse
  - `sig`: HMAC-SHA256 signature
- **Behavior**: 
  - Validates signature
  - Checks user authentication
  - Redirects to login if not authenticated
  - Returns signed user data to Discourse if authenticated

### `POST /sso/logout`
- **Purpose**: Handle logout from Discourse
- **Authentication**: Requires valid JWT token
- **Behavior**: Logs user out from main site

## 5. User Data Mapping

The following user data is sent to Discourse:

| Discourse Field | Source (SMF Database) | Description |
|-----------------|----------------------|-------------|
| `external_id`   | `id_member`          | Unique user ID |
| `username`      | `member_name`        | Username |
| `email`         | `email_address`      | Email address |
| `name`          | `member_name`        | Display name |
| `admin`         | `id_group = 1` or `id_member = 1/17667` | Admin status |
| `moderator`     | Same as admin        | Moderator status |

## 6. Testing SSO

1. **Start your Node.js API**:
   ```bash
   docker-compose up -d api
   ```

2. **Visit Discourse**: Navigate to your Discourse forum
3. **Observe redirect**: You should be redirected to your login page
4. **Log in**: After successful login, you should be redirected back to Discourse and automatically logged in

## 7. Troubleshooting

### Common Issues

1. **Invalid SSO signature**
   - Ensure `DISCOURSE_SSO_SECRET` is identical in both `.env` and Discourse `app.yml`
   - Check for extra whitespace or newlines

2. **Redirect loops**
   - Verify the SSO URL in Discourse points to the correct domain
   - Check that cookies are being set correctly

3. **User not created in Discourse**
   - Verify user data mapping is correct
   - Check Discourse logs for validation errors

### Debug Mode

Add this to your Node.js console to debug SSO:

```javascript
// In your SSO endpoint, add logging:
console.log('SSO Debug:', {
  sso: sso,
  sig: sig,
  ssoParams: ssoParams,
  user: user
});
```

## 8. Security Considerations

- **Use HTTPS**: SSO should only be used over HTTPS in production
- **Secure Secret**: Use a strong, random secret key (32+ characters)
- **Domain Matching**: Ensure both sites are on the same domain or subdomain
- **Regular Updates**: Keep both Node.js and Discourse updated

## 9. Production Deployment

1. Set strong environment variables
2. Use HTTPS for both sites
3. Configure proper CORS if needed
4. Monitor logs for SSO errors
5. Test thoroughly before going live

---

For more information, see the [official Discourse SSO documentation](https://meta.discourse.org/t/official-single-sign-on-for-discourse/13045).