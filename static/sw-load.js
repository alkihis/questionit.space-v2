// application.js
// Register the serviceWorker script at /serviceworker.js from our server if supported
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/serviceworker.js')
    .catch(() => {
      console.log("Unable to register service worker.");
    });
}
// Otherwise, no push notifications :(
else {
  console.error('Service worker is not supported in this browser');
}
