# Voxel Vault Intelligence Layer

## Internet + AI
Voxel Vault now has a server-side AI research route at `/api/ai/research`. When `OPENAI_API_KEY` is configured, it uses the OpenAI Responses API with web search so research can use current web information instead of a frozen local knowledge base.

The browser never receives the API key. Queries are length-limited and the route returns a controlled answer. Production should add authentication and rate limiting before exposing the endpoint broadly.

Required environment:
- `OPENAI_API_KEY`
- optional `VOXEL_AI_RESEARCH_MODEL`

This is intentionally not unrestricted arbitrary internet access. The application should use explicit research tools/providers rather than becoming an SSRF proxy or fetching arbitrary internal URLs.

## AI
The existing asset planner/director/quality gate remains the 3D generation backbone. The Intelligence Lab provides a user-facing research surface for current information and a future place for provenance analysis, object identification, recommendations, and collection intelligence.

## Quantum computing
The Intelligence Lab includes a small classical statevector simulator for a Bell-state experiment. It demonstrates quantum-state mathematics locally and is deliberately labeled as simulation, not physical quantum hardware access.

Future hardware adapters can be added behind a server-side provider interface for compatible quantum services. Credentials remain server-side, experiments are allowlisted, and result provenance should record provider, circuit, timestamp, and job ID.

## Product direction
AI + web research should help users discover objects, understand provenance, generate 3D twins, compare collectibles, and explain purchase histories. Quantum tools should live as an experimental technology layer, not make unsupported claims about NFT ownership, value, or physical-world facts.
