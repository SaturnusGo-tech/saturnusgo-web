# Falcon character avatars

The approved collection contains twenty named characters. The shared catalog owns
their public brand-asset URLs and EN/RU names. Private user-uploaded photos continue
through the authorized, expiring media-grant API.

## Presentation contract

- Character artwork has a transparent background. Do not introduce white discs,
  pale portrait backdrops or white outer rings on the dark theme.
- Surfaces behind transparent artwork use the existing Falcon theme tokens.
- A selected character has a theme-aware selection ring and checkmark.
- The chooser uses HeroUI Modal, keeps header/footer visible and scrolls the gallery.
- Cancel preserves the current avatar; Save commits the explicit selection.
- A custom photo takes precedence over the persisted character. Removing the photo
  restores that same character; random assignment happens once on the server.
- Agent profiles retain the official Codex mark and do not receive human characters.
- An unavailable photo falls back to the character, then initials. Never retry
  alternately between failed URLs.

Public assets are versioned and immutable. Publish changed image bytes at a new
versioned URL; do not overwrite a cached asset in place.
