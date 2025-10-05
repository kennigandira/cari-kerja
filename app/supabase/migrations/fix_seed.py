#!/usr/bin/env python3
import re

# Read the file
with open('003_seed_jobs.sql', 'r') as f:
    content = f.read()

# Replace pattern 1: Add created_by to column list in all INSERT statements
column_pattern = r"(INSERT INTO jobs \([^\)]+)\n\) VALUES \("
column_replacement = r"\1,\n  created_by\n) VALUES ("

# Replace pattern 2: find lines ending with folder path and closing paren, add created_by
value_pattern = r"('04_Applications/[^']+'),?\n\);"
value_replacement = r"\1,\n  '31169b06-bbd0-46e5-985a-7d4506f26b15'  -- Placeholder UUID for seed data\n);"

# Apply the replacements
fixed_content = re.sub(column_pattern, column_replacement, content)
fixed_content = re.sub(value_pattern, value_replacement, fixed_content)

# Write back to file
with open('003_seed_jobs.sql', 'w') as f:
    f.write(fixed_content)

print("Fixed seed data file")
