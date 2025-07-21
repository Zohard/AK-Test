# API Setup Instructions

## Quick Start

To set up the API with PostgreSQL database:

```bash
node apply-fixed-schema.js    # Create tables
node final-data-import.js     # Import data
node server-postgresql.js     # Start API
```

## Prerequisites

- Node.js installed
- PostgreSQL database running
- Database connection configured in environment variables