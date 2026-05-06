# Backend — ESLint + Prettier Setup

## 1. Install dev dependencies

npm install -D \
 eslint \
 @eslint/js \
 typescript-eslint \
 prettier \
 eslint-config-prettier

## 2. Add these scripts to package.json

"scripts": {
"build": "tsc",
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check ."
}

## 3. Make sure tsconfig.json has:

{
"compilerOptions": {
"outDir": "./dist",
"rootDir": "./src",
...
}
}
