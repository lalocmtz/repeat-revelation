

## Issue: Login Freezes on Auth Page

**Root cause**: The Auth page has no redirect logic for already-authenticated users. After a successful login, `navigate("/dashboard")` is called, but if the page reloads (e.g., due to preview refresh), the user lands back on `/auth` with the spinner stuck. Additionally, `setLoading(false)` is never called after successful login since navigation happens first.

## Plan

### Fix Auth page (`src/pages/Auth.tsx`)
1. Import `useAuth` from AuthContext
2. Add a `useEffect` that checks if the user is already authenticated and redirects to `/dashboard`
3. Ensure `setLoading(false)` is called after successful login (before navigate)
4. Show a loading state while auth is being checked

```typescript
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (!authLoading && user) {
    navigate("/dashboard");
  }
}, [user, authLoading, navigate]);

if (authLoading) {
  return <loading spinner>;
}
```

This is a single-file fix to `src/pages/Auth.tsx`.

