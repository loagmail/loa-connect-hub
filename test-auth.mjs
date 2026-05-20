async function test() {
  // Login
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie().filter((c) =>
    c.startsWith("authjs.csrf-token=")
  );
  const csrfCookieVal = csrfCookies[csrfCookies.length - 1].split(";")[0];

  console.log("CSRF token:", csrfToken);

  const loginRes = await fetch(
    "http://localhost:3000/api/auth/callback/credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookieVal,
      },
      body: new URLSearchParams({
        csrfToken,
        email: "student@econsult.com",
        password: "password123",
        callbackUrl: "http://localhost:3000/",
      }),
      redirect: "manual",
    }
  );

  const rawSessionCookies = loginRes.headers.getSetCookie() || [];
  const sessionCookie = rawSessionCookies.filter((c) =>
    c.startsWith("authjs.session-token=")
  );

  if (sessionCookie.length === 0) {
    console.log("ERROR: No session cookie set");
    console.log("Login status:", loginRes.status);
    console.log("Location:", loginRes.headers.get("location"));
    rawSessionCookies.forEach((c) => console.log("Cookie:", c.substring(0, 60)));
    return;
  }

  const sessionCookieVal = sessionCookie[0].split(";")[0];
  console.log("Session cookie set, length:", sessionCookieVal.length);

  // Verify session
  const sessRes = await fetch("http://localhost:3000/api/auth/session", {
    headers: { Cookie: sessionCookieVal },
  });
  const sessData = await sessRes.json();
  console.log("Session data:", JSON.stringify(sessData, null, 2));

  if (sessData?.user) {
    console.log("LOGIN WORKS! User:", sessData.user.name, `(${sessData.user.role})`);
  } else {
    console.log("Session is null - JWT cannot be decoded");
  }
}

test().catch(console.error);
