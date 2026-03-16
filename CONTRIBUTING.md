# Contributing

## Development Flow

1. Install dependencies with `npm run bootstrap`.
2. Copy the env templates into local `.env` files.
3. Run `npm run dev` for interactive work.
4. Run `npm run verify` before opening a pull request.

## Pull Request Expectations

- Keep changes scoped and explain the user-facing or operational impact.
- Update docs when commands, configuration, or runtime behavior changes.
- Do not commit secrets, local env files, or generated runtime data.

## Testing

- Root verification: `npm run verify`
- Workspace tests: `npm test --workspace=router-backend`

If you add a new provider integration or payment path, include at least one automated test or a documented manual validation path.
