# Folder architecture editing

The folder action menu routes **Name and location** to the existing Folder structure page, reveals the target branch and begins inline renaming. The selected test case remains in the repository URL so returning restores the same context. There is no second Edit Folder dialog.

The structure page keeps the compact tree, folder appearances and curved connectors. Folder names support inline editing with Enter to save and Escape to cancel. Existing drag-and-drop validation governs folder movement. Selection mode adds batch movement with an in-page destination browser; selected descendants move with their selected ancestor, and invalid/self/descendant destinations are unavailable. Partial failures retain unsuccessful selections and report the result honestly. Editing controls respect permissions, loading and mutation state.

Dragging uses the actual source row's appearance and width rather than a generic label block. The visual copy is inert, hidden from accessibility APIs, and cannot duplicate IDs or interactive focus targets. A small count identifies a group of selected cases.

Implementation work:

1. Add regression coverage for action-menu routing and preserved case context; wire target-folder focus through repository navigation.
2. Extend the existing architecture tree with inline rename and guarded single/batch movement using FolderResource.update.
3. Replace generic drag previews with sanitized copies of source rows, preserving folder icons and case details.
4. Run focused behavioral tests, TypeScript and architecture checks; review the integrated change. Publish the source, Pages and production Worker using the existing release scripts.

The user performs full visual acceptance testing. Automated verification is limited to the affected navigation, editing, selection and drag behavior.
