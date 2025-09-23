# Mise Configuration Fix

## Problem

The PR deployment was failing with:

```bash
mise ERROR error sending request for url (https://nodejs.org/dist/index.json)
mise ERROR operation timed out
```

## Root Cause

Mise was trying to fetch Node.js version information from nodejs.org but timing
out due to network issues in the deployment environment.

## Solution

Added mise configuration files to specify exact Node.js version:

1. `.tool-versions` - Specifies Node.js 20.18.0 (LTS)
2. `mise.toml` - Comprehensive mise configuration
3. Updated `.gitignore` to exclude `.mise.local.toml`

## Files Added/Modified

- `.tool-versions` (new)
- `mise.toml` (new)
- `.gitignore` (updated)

This prevents mise from making network calls to determine which Node.js version
to install, fixing the deployment timeout issue.
