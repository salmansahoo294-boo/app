# Vercel Configuration for WINPKRHUB Frontend

## IMPORTANT: Vercel Dashboard Settings

### Project Settings → General

**Root Directory:** `frontend`
- Click "Edit" next to Root Directory
- Enter: `frontend`
- Save

**Framework Preset:** `Create React App`
- Select from dropdown

**Build & Development Settings:**

- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install --legacy-peer-deps`

### Environment Variables

Add these in Project Settings → Environment Variables:

```
REACT_APP_BACKEND_URL=https://gamepro.preview.emergentagent.com
GENERATE_SOURCEMAP=false
CI=false
NODE_OPTIONS=--max-old-space-size=4096
```

### Why Build Hangs Without These Settings

1. **Root Directory Not Set:** Vercel tries to build from `/` instead of `/frontend`
2. **CI=true (default):** Treats warnings as errors and hangs
3. **Memory Issues:** Node runs out of memory with default settings
4. **TypeScript Checking:** ForkTsCheckerWebpackPlugin can hang on Vercel

### Troubleshooting

If build still hangs:
1. Check Vercel build logs for memory errors
2. Ensure Root Directory is set to `frontend`
3. Verify NODE_OPTIONS environment variable is set
4. Check that all env vars are added

### Alternative: Use vercel.json (Current Setup)

The `vercel.json` file is configured to build from root with `--prefix frontend` flag.
This works if you DON'T set Root Directory in dashboard.

**Choose ONE approach:**
- **Option A:** Set Root Directory to `frontend` in dashboard + use simple commands
- **Option B:** Leave Root Directory empty + use vercel.json with `--prefix` flags

**Current Config Uses:** Option B (vercel.json with --prefix)
