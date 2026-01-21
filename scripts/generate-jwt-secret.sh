#!/bin/bash

# Generate a secure JWT secret for GPTO Suite

echo "🔐 Generating JWT Secret..."
echo ""

# Try different methods
if command -v openssl &> /dev/null; then
  SECRET=$(openssl rand -base64 32)
  echo "Generated using OpenSSL:"
elif command -v node &> /dev/null; then
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  echo "Generated using Node.js:"
elif command -v python3 &> /dev/null; then
  SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
  echo "Generated using Python:"
else
  echo "⚠️  No suitable tool found. Install OpenSSL, Node.js, or Python."
  echo ""
  echo "Manual generation options:"
  echo "1. Visit: https://generate-secret.vercel.app/32"
  echo "2. Use: openssl rand -base64 32"
  exit 1
fi

echo ""
echo "Add this to your .env file:"
echo ""
echo "JWT_SECRET=$SECRET"
echo ""
echo "⚠️  Keep this secret secure and never commit it to git!"
