SELECT 'CREATE DATABASE nest_monolith_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nest_monolith_test')\gexec
