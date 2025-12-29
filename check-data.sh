#!/bin/bash
# Quick script to check stored data

echo "=== Recent Task ==="
curl -s http://localhost:3000/api/tasks/c120266b-3a66-4aad-9fac-259d3594d136 | python -m json.tool

echo -e "\n\n=== Research Result ==="
curl -s http://localhost:3000/api/research/c120266b-3a66-4aad-9fac-259d3594d136 | python -m json.tool
