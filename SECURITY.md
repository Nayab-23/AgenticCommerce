# Security

## Secret Handling

- Never commit real Circle, provider, wallet, or webhook secrets.
- Use the checked-in `.env.example` files as placeholder templates only.
- Treat `router-backend/data/` as local runtime output and keep it out of commits.

## Reporting

If you discover a security issue, do not open a public issue with exploit details. Share a private report with the repository owner including:

- affected area
- reproduction steps
- impact assessment
- suggested remediation if available
