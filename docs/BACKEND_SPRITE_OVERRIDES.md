# Backend: global `spriteOverrides` API

Apply these changes on [idleDnD-Backend](https://github.com/jontslater/idleDnD-Backend) (separate PR — cloud agent could not push to that repo).

## Firestore

- Document: `config/spriteOverrides`
- Shape:

```json
{
  "heroes": {
    "mage": { "flip": true, "scaleMultiplier": 1.05, "offsetY": 2 }
  },
  "enemies": {
    "Masked Orc": { "flip": false, "offsetY": -3 }
  },
  "updatedAt": "<server timestamp>",
  "updatedBy": "tehchno"
}
```

## Routes

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/config/sprite-overrides` | None (public read for all clients) |
| `PUT` | `/api/config/sprite-overrides` | `verifyToken` + admin login |

Admin allowlist (override with env `SPRITE_OVERRIDE_ADMIN_LOGINS=comma,separated`):

- `theneverendingwar`
- `tehchno`

## Files added in this branch (copy from agent worktree)

1. `src/utils/spriteOverrideAdmin.js` — `requireSpriteOverrideAdmin`
2. `src/routes/spriteOverrides.js` — GET + PUT handlers
3. `src/index.js` — `app.use('/api/config/sprite-overrides', spriteOverridesRoutes)`

Branch name used locally: `cursor/sprite-overrides-api-c091`

## Deploy order

1. Merge & deploy backend PR
2. Merge frontend PR #14 — `/battlefield-facing` Save calls `PUT /api/config/sprite-overrides`

Until backend is deployed, editor **Save** returns an API error; **Export JSON** still works for baking into code.
