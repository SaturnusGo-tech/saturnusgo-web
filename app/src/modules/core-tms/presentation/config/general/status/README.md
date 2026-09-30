# React Bits Status Mark adaptation

This directory adapts David Haz's React Bits Status Mark for Falcon's inline project-save feedback.

Upstream commit: `056aa235d4b5a17aa8ba2b5808554e0f37d2cf27` (2026-09-29).

- [Component documentation](https://reactbits.dev/micro/status-mark)
- [Exact TypeScript source](https://github.com/DavidHDev/react-bits/blob/056aa235d4b5a17aa8ba2b5808554e0f37d2cf27/src/ts-default/Micro/StatusMark/StatusMark.tsx)
- [Exact CSS source](https://github.com/DavidHDev/react-bits/blob/056aa235d4b5a17aa8ba2b5808554e0f37d2cf27/src/ts-default/Micro/StatusMark/StatusMark.css)
- [Exact upstream license](https://github.com/DavidHDev/react-bits/blob/056aa235d4b5a17aa8ba2b5808554e0f37d2cf27/LICENSE.md)

The upstream ring interpolation, spinner, and drawn check/cross are preserved. Falcon's adaptation uses a compact `status`, localized `label`, and optional `size` API; inherits text color; omits fills, strike-through, and built-in English strings; and announces the supplied label through a polite status region. Motion transitions stop on state changes and unmount, preserving their current values during interruption. Reduced-motion preferences are observed dynamically, and both JavaScript and CSS animation become static.

Uses the application's existing `motion/react` dependency. The full upstream MIT + Commons Clause license is retained in [LICENSE.md](./LICENSE.md).
