## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

<table>
<tr><td>⏱️&nbsp;<strong>Estimated effort to review</strong>: 3 🔵🔵🔵⚪⚪</td></tr>
<tr><td>🧪&nbsp;<strong>No relevant tests</strong></td></tr>
<tr><td>🔒&nbsp;<strong>Security concerns</strong><br><br>

<strong>- Sensitive information exposure:</strong><br> Multiple endpoints and middleware log emails, userIds, and event details to console (e.g., successful login/registration/refresh). In production, this PII should be minimized or redacted, and logs should avoid correlating user identifiers unless necessary and consented.
- Token handling: Authorization header parsing is strict (good), but responses do not set security headers consistently across endpoints. Login adds a helper but does not use it; ensure no-cache headers on all auth responses.
- Environment validation: JWT_SECRET length check is good; ensure .env.example reminds not to commit secrets (present) and that production enforces strong secrets.</td></tr>
<tr><td>⚡&nbsp;<strong>Recommended focus areas for review</strong><br><br>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-1d233da68a6f8c33163b416049fa9bdcf14a506989601779402973a5a220c476R122-R129'><strong>PII Logging</strong></a>

Console logs include user email and IDs on success and failure paths; ensure production logging redacts or suppresses PII and uses a structured logger with appropriate levels.
</summary>

```typescript
console.log('Successful registration:', {
  tenantId: tenant.id,
  userId: authResponse.user.id,
  email: authResponse.user.email,
  role: authResponse.user.role,
  timestamp: new Date().toISOString()
});

```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-f5b7036a8c1b0d0fc12e8a47f5098a6023d758baa3c69e340b4079d0a837b39aR69-R83'><strong>Expiry Parsing</strong></a>

Custom parsing of string expiresIn may accept invalid values silently and defaults to 24h; consider delegating to jsonwebtoken's expiresIn option or validating the unit/value to avoid unintended lifetimes.
</summary>

```typescript
if (typeof expiresIn === 'string') {
  // Parse time strings like '24h', '7d', '30m'
  const timeValue = parseInt(expiresIn);
  const timeUnit = expiresIn.slice(-1);

  switch (timeUnit) {
    case 's': exp = now + timeValue; break;
    case 'm': exp = now + (timeValue * 60); break;
    case 'h': exp = now + (timeValue * 60 * 60); break;
    case 'd': exp = now + (timeValue * 24 * 60 * 60); break;
    default: exp = now + (24 * 60 * 60); // Default to 24 hours
  }
} else {
  exp = now + (24 * 60 * 60); // Default to 24 hours
}
```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-00edcb7cb402610ed7c96acfc98b4f1847866ecad3f56816d26bc73f339d2469R97-R107'><strong>Unique Constraint Detection</strong></a>

Email-duplicate detection relies on checking error.message for 'unique constraint'; prefer checking database error codes (e.g., PG code 23505) to avoid false negatives across drivers/locales.
</summary>

```typescript
console.error('Error creating user:', error);

// Check for unique constraint violation (email already exists)
if (error instanceof Error && error.message.includes('unique constraint')) {
  throw new AuthenticationError(
    AuthErrorCode.EMAIL_ALREADY_EXISTS,
    'An account with this email already exists'
  );
}

throw new Error('Database error during user creation');
```

</details>

</td></tr>
</table>


## PR Code Suggestions ✨

<!-- d74e065 -->

Explore these optional code suggestions:

<table><thead><tr><td><strong>Category</strong></td><td align=left><strong>Suggestion&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </strong></td><td align=center><strong>Impact</strong></td></tr><tbody><tr><td rowspan=2>Security</td>
<td>



<details><summary>Use a cryptographically secure generator</summary>

___

**Replace <code>Math.random()</code> with the cryptographically secure <code>crypto.randomInt()</code> in <br>the <code>generateSecurePassword</code> function to prevent predictable password generation.**

[app/lib/password.ts [247-273]](https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-92fefffcac7b66bcf106bde8b424222a57a6fa50788690d4e743651a656dc2cbR247-R273)

```diff
+import { randomInt } from 'crypto';
+
 export function generateSecurePassword(length: number = 16): string {
   if (length < 8 || length > 128) {
     throw new Error('Password length must be between 8 and 128 characters');
   }
 
   const lowercase = 'abcdefghijklmnopqrstuvwxyz';
   const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   const numbers = '0123456789';
   const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
   
   const allChars = lowercase + uppercase + numbers + special;
   let password = '';
 
   // Ensure at least one character from each category
-  password += lowercase[Math.floor(Math.random() * lowercase.length)];
-  password += uppercase[Math.floor(Math.random() * uppercase.length)];
-  password += numbers[Math.floor(Math.random() * numbers.length)];
-  password += special[Math.floor(Math.random() * special.length)];
+  password += lowercase[randomInt(lowercase.length)];
+  password += uppercase[randomInt(uppercase.length)];
+  password += numbers[randomInt(numbers.length)];
+  password += special[randomInt(special.length)];
 
   // Fill the rest randomly
   for (let i = 4; i < length; i++) {
-    password += allChars[Math.floor(Math.random() * allChars.length)];
+    password += allChars[randomInt(allChars.length)];
   }
 
   // Shuffle the password to avoid predictable patterns
-  return password.split('').sort(() => Math.random() - 0.5).join('');
+  return password.split('').sort(() => randomInt(0, 2) - 0.5).join('');
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=0 -->


<details><summary>Suggestion importance[1-10]: 9</summary>

__

Why: The suggestion fixes a critical security vulnerability by replacing a non-secure random number generator with a cryptographically secure one for password generation.

</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>Use native constant-time comparison function</summary>

___

**Replace the custom <code>constantTimeEqual</code> function with the built-in <br><code>crypto.timingSafeEqual</code> to ensure a secure, constant-time comparison and prevent <br>potential timing attacks.**

[app/lib/password.ts [286-297]](https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-92fefffcac7b66bcf106bde8b424222a57a6fa50788690d4e743651a656dc2cbR286-R297)

```diff
+import { timingSafeEqual } from 'crypto';
+
 export function constantTimeEqual(a: string, b: string): boolean {
   if (a.length !== b.length) {
     return false;
   }
 
-  let result = 0;
-  for (let i = 0; i < a.length; i++) {
-    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
-  }
+  const aBuffer = Buffer.from(a);
+  const bBuffer = Buffer.from(b);
 
-  return result === 0;
+  return timingSafeEqual(aBuffer, bBuffer);
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=1 -->


<details><summary>Suggestion importance[1-10]: 8</summary>

__

Why: The suggestion enhances security by replacing a custom, potentially vulnerable constant-time comparison function with Node.js's native and battle-tested `crypto.timingSafeEqual`.

</details></details></td><td align=center>Medium

</td></tr><tr><td rowspan=1>High-level</td>
<td>



<details><summary>Simplify JWT expiration handling</summary>

___

**Refactor the <code>createToken</code> function in <code>app/lib/jwt.ts</code> to use the <code>jsonwebtoken</code> <br>library's built-in <code>expiresIn</code> option. This removes the complex and error-prone <br>manual logic for parsing time strings and setting the expiration claim.**


### Examples:



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-f5b7036a8c1b0d0fc12e8a47f5098a6023d758baa3c69e340b4079d0a837b39aR58-R103">app/lib/jwt.ts [58-103]</a>
</summary>



```typescript
export function createToken(
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  options: TokenOptions = {}
): string {
  const config = getAuthConfig();
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || config.jwtExpiresIn;
  
  // Calculate expiration timestamp

 ... (clipped 36 lines)
```
</details>




### Solution Walkthrough:



#### Before:
```typescript
export function createToken(payload, options = {}) {
  const config = getAuthConfig();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || config.jwtExpiresIn;
  
  // Manual parsing of expiresIn string to calculate 'exp'
  let exp;
  if (typeof expiresIn === 'string') {
    // ... custom switch-case logic for 's', 'm', 'h', 'd' ...
  } else {
    exp = now + (24 * 60 * 60);
  }

  const fullPayload = { ...payload, iat: now, exp, ... };

  // Manual timestamping requires `noTimestamp: true`
  const token = jwt.sign(fullPayload, config.jwtSecret, { noTimestamp: true });
  return token;
}

```



#### After:
```typescript
export function createToken(payload, options = {}) {
  const config = getAuthConfig();
  const expiresIn = options.expiresIn || config.jwtExpiresIn;

  // Delegate expiration and timestamping to the library
  const token = jwt.sign(
    { ...payload },
    config.jwtSecret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: expiresIn,
      issuer: options.issuer || config.jwtIssuer,
      audience: options.audience || config.jwtAudience
    }
  );
  return token;
}

```




<details><summary>Suggestion importance[1-10]: 6</summary>

__

Why: The suggestion correctly identifies redundant custom logic for JWT expiration and proposes a simpler, more robust solution by leveraging the native capabilities of the `jsonwebtoken` library.


</details></details></td><td align=center>Low

</td></tr><tr><td rowspan=2>General</td>
<td>



<details><summary>Delegate token expiration to library</summary>

___

**Simplify the <code>createToken</code> function by removing manual expiration calculation and <br>instead passing <code>expiresIn</code>, <code>issuer</code>, and <code>audience</code> directly to the <code>jwt.sign()</code> <br>options.**

[app/lib/jwt.ts [58-103]](https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-f5b7036a8c1b0d0fc12e8a47f5098a6023d758baa3c69e340b4079d0a837b39aR58-R103)

```diff
 export function createToken(
   payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
   options: TokenOptions = {}
 ): string {
   const config = getAuthConfig();
   
-  const now = Math.floor(Date.now() / 1000);
   const expiresIn = options.expiresIn || config.jwtExpiresIn;
-  
-  // Calculate expiration timestamp
-  let exp: number;
-  if (typeof expiresIn === 'string') {
-    // Parse time strings like '24h', '7d', '30m'
-    const timeValue = parseInt(expiresIn);
-    const timeUnit = expiresIn.slice(-1);
-    
-    switch (timeUnit) {
-      case 's': exp = now + timeValue; break;
-      case 'm': exp = now + (timeValue * 60); break;
-      case 'h': exp = now + (timeValue * 60 * 60); break;
-      case 'd': exp = now + (timeValue * 24 * 60 * 60); break;
-      default: exp = now + (24 * 60 * 60); // Default to 24 hours
-    }
-  } else {
-    exp = now + (24 * 60 * 60); // Default to 24 hours
-  }
+  const issuer = options.issuer || config.jwtIssuer;
+  const audience = options.audience || config.jwtAudience;
 
-  const fullPayload: JWTPayload = {
-    ...payload,
-    iat: now,
-    exp,
-    iss: options.issuer || config.jwtIssuer,
-    aud: options.audience || config.jwtAudience
-  };
+  // The payload for `jwt.sign` should not include standard claims
+  // that are handled by the options object.
+  const signPayload = { ...payload };
 
   try {
-    const token = jwt.sign(fullPayload, config.jwtSecret, {
+    const token = jwt.sign(signPayload, config.jwtSecret, {
       algorithm: JWT_ALGORITHM,
-      noTimestamp: true // We set iat manually for consistency
+      expiresIn,
+      issuer,
+      audience
     });
 
     return token;
   } catch (error) {
     throw new Error('Failed to create JWT token');
   }
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=3 -->


<details><summary>Suggestion importance[1-10]: 6</summary>

__

Why: The suggestion improves code quality and reliability by removing manual JWT claim calculation and delegating it to the `jsonwebtoken` library's built-in options.

</details></details></td><td align=center>Low

</td></tr><tr><td>



<details><summary>Remove redundant token expiration check</summary>

___

**Remove the redundant <code>payload.exp < now</code> check from the <code>isValidJWTPayload</code> <br>function, as token expiration is already handled by <code>jwt.verify()</code>.**

[app/lib/jwt.ts [257-309]](https://github.com/Liam345/growplate-multi-tenant/pull/7/files#diff-f5b7036a8c1b0d0fc12e8a47f5098a6023d758baa3c69e340b4079d0a837b39aR257-R309)

```diff
 function isValidJWTPayload(payload: any): payload is JWTPayload {
   if (!payload || typeof payload !== 'object') {
     return false;
   }
 ... (clipped 25 lines)
   const now = Math.floor(Date.now() / 1000);
   const oneYearFromNow = now + (365 * 24 * 60 * 60);
   const oneYearAgo = now - (365 * 24 * 60 * 60);
 
   if (payload.iat < oneYearAgo || payload.iat > now + 60) { // Allow 60s clock skew
     return false;
   }
 
-  if (payload.exp < now || payload.exp > oneYearFromNow) {
+  // The `jwt.verify` function already checks for expiration.
+  // This check is for sanity, ensuring the expiration is not too far in the future.
+  if (payload.exp > oneYearFromNow) {
     return false;
   }
 
   return true;
 }
```



`[To ensure code accuracy, apply this suggestion manually]`


<details><summary>Suggestion importance[1-10]: 3</summary>

__

Why: The suggestion correctly identifies and removes a redundant token expiration check, as this validation is already performed by the `jwt.verify()` function, which simplifies the code.

</details></details></td><td align=center>Low

</td></tr>
<tr><td align="center" colspan="2">

- [ ] More <!-- /improve --more_suggestions=true -->

</td><td></td></tr></tbody></table>

