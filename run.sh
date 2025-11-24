#!/usr/bin/env bash

set -euo pipefail

node_modules/.bin/prisma migrate deploy

node server.js
