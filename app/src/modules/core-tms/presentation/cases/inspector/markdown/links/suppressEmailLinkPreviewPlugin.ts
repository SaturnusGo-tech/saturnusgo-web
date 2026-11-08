import { linkDialogState$, realmPlugin } from "@mdxeditor/editor";

export const suppressEmailLinkPreviewPlugin = realmPlugin({
  init(realm) {
    realm.sub(linkDialogState$, (state) => {
      if (state.type !== "preview" || !/^mailto:/i.test(state.url)) return;
      // Let selection updates finish, and leave explicit link editing alone.
      queueMicrotask(() => {
        if (realm.getValue(linkDialogState$) === state) {
          realm.pub(linkDialogState$, { type: "inactive" });
        }
      });
    });
  },
});
