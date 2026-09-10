/* Falcon personal Web Push. No tokens or attachment content are cached here. */
self.addEventListener("push", event => {
  event.waitUntil((async () => {
    let message;
    try { message = event.data?.json(); } catch { return; }
    if (!message || typeof message.workspaceId !== "string" || typeof message.identityId !== "string") return;
    const response = await fetch(`/api/v1/notifications/settings?${new URLSearchParams({workspaceId:message.workspaceId})}`,
      {credentials:"include",cache:"no-store",redirect:"error"});
    if (!response.ok) return;
    const current = await response.json();
    // A browser shared by several testers must not display the previous user's messages.
    if (current?.data?.identityId !== message.identityId) return;
    if (!current.data.browsers?.some(browser => browser.id === message.destinationId)) return;
    const url = new URL(message.url, self.location.origin);
    if (url.origin !== self.location.origin || !url.pathname.startsWith("/testcases/")) return;
    await self.registration.showNotification(String(message.title).slice(0,200), {
      body:String(message.body).slice(0,500),tag:String(message.tag),
      icon:"/falcon/falcon-mark-dark.png",data:{url:url.href},renotify:false
    });
  })());
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL(event.notification.data?.url || "/", self.location.origin);
    if (url.origin !== self.location.origin) return;
    const windows = await self.clients.matchAll({type:"window",includeUncontrolled:true});
    const target = windows.find(client => new URL(client.url).origin === url.origin);
    if (target) { await target.navigate(url.href); await target.focus(); }
    else await self.clients.openWindow(url.href);
  })());
});
