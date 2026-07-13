#!/bin/bash
# Validate and push the current branch. GitHub Actions deploys only main.
set -euo pipefail

npm ci
npm test
npm run build

branch=$(git branch --show-current)
git push -u origin "$branch"

echo "Validated and pushed $branch. Merge to main only after review; main deploys through GitHub Actions."
