// মেস/সাবলেট খোঁজো — Service Worker (রিয়েল পুশ নোটিফিকেশন)
// সাইট বন্ধ থাকলেও ফোনে নোটিফিকেশন দেখাবে

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "🔔 মেস/সাবলেট খোঁজো";
  const options = {
    body: data.message || "নতুন নোটিশ এসেছে!",
    // আইকন: সাইটের favicon (না থাকলে ডিফল্ট)
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      url: data.url || "/",
    },
    // ভাইব্রেশন প্যাটার্ন (মোবাইলে)
    vibrate: [200, 100, 200],
    tag: "mess-khojo-notice",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      // ইতিমধ্যে খোলা ট্যাব থাকলে সেটাতে ফোকাস করো
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (client.url.includes(self.location.origin)) {
          await client.navigate(url);
          return client.focus();
        }
      }
      // না থাকলে নতুন ট্যাব খোলো
      return self.clients.openWindow(url);
    })()
  );
});
