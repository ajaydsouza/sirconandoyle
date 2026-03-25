#!/bin/bash
# Helper script to test search locally

echo "Cleaning previous build..."
rm -rf dist

echo "Building the site..."
npm run build

echo "Previewing the site..."
echo "Test search at:  http://localhost:4321/search/"
echo "View sitemap at: http://localhost:4321/sitemap-index.xml"
npx serve dist/client -l 4321
