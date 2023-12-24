#!/bin/bash
ts-node -r tsconfig-paths/register src/functions/odoo/snapshot/restore.ts "$@" | yarn pino-pretty
