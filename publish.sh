#!/bin/bash
# Daily Tracker — one-shot publish to GitHub Pages
# Run from inside the pwa-tracker folder:  bash publish.sh
set -e

REPO="pwa-tracker"

echo "==> Checking gh auth..."
gh auth status >/dev/null

OWNER=$(gh api user -q .login)
echo "==> GitHub user: $OWNER"

# init git if needed
if [ ! -d .git ]; then
  git init -b main
fi
git add -A
git commit -m "Daily Tracker PWA — habits + expenses" || echo "(nothing new to commit)"

# create repo if it doesn't exist, then push
if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  echo "==> Repo exists, pushing..."
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$OWNER/$REPO.git"
  git push -u origin main
else
  echo "==> Creating repo and pushing..."
  gh repo create "$REPO" --public --source=. --remote=origin --push
fi

# enable GitHub Pages from main branch root
echo "==> Enabling GitHub Pages..."
gh api "repos/$OWNER/$REPO/pages" -X POST \
  -f "source[branch]=main" -f "source[path]=/" 2>/dev/null \
  || echo "(Pages already enabled)"

URL="https://$OWNER.github.io/$REPO/"
echo ""
echo "✅ Done! Your app will be live in ~1 minute at:"
echo "   $URL"
echo ""
echo "Next: open that URL in Safari on your iPhone → sign in → Share → Add to Home Screen."
