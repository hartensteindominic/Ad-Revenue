# Live AI Asset Pipeline

The asset-plan API now has two modes:

- `live: false` (default): deterministic local planning and quality checks.
- `live: true`: sends the provider payload to the server-side provider configured by `VOXEL_AI_ASSET_PROVIDER_URL`.

The optional provider key is read only on the server from `VOXEL_AI_ASSET_PROVIDER_KEY` and is never returned to the browser.

A live provider must return JSON. The route returns the provider result under `ai.result` and identifies whether the response came from `live` or `local-planner` mode.

The provider should be responsible for actual model generation or a downstream generation job. The deterministic planner remains the source of identity and constraints.
