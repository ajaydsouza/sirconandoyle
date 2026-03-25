#!/bin/bash
# Helper script to test search locally

echo "Cleaning previous build..."
rm -rf dist

echo "Building the site..."
npm run build

echo "Previewing the site using a static server..."
echo "You can now test the search at http://localhost:4321/search/"
npx serve dist/client -l 4321
