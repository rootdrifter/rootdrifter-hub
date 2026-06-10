# Privacy Denylist — POSIX ERE patterns, one per line
# Comments with #. directives/ and tooling/ paths are EXEMPT.
# OPERATOR: add real values in the section below.

# Private key material
-----BEGIN [A-Z ]*PRIVATE KEY-----

# AWS/cloud key patterns
AKIA[0-9A-Z]{16}

# Full UUID (catches real LUKS UUIDs)
[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}

# Real-looking IP ranges (non-documentation)
192\.168\.[0-9]{1,3}\.[0-9]{1,3}
10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}
100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.[0-9]{1,3}\.[0-9]{1,3}

# OPERATOR ADDS REAL VALUES HERE:
# Uncomment and replace with actual values before running scanner
# your-real-hostname
# your-real-codename
# your-real-alias-prefix
