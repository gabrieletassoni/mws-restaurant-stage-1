/**
 * 
 * @description App helper class
 */
class AppHelper {

    /**
     * @description Method to register the service worker
     */
    static registerServiceWorker() {
      if (!navigator.serviceWorker) return;
  
      navigator.serviceWorker.register('/js/sw/index.js').then(function (reg) {
        if (!navigator.serviceWorker.controller) {
          return;
        }
  
        if (reg.waiting) {
          AppHelper.updateReady(reg.waiting);
          return;
        }
  
        if (reg.installing) {
          AppHelper.trackInstalling(reg.installing);
          return;
        }
  
        reg.addEventListener('updatefound', function () {
          AppHelper.trackInstalling(reg.installing);
        });
      });
  
      // Ensure refresh is only called once.
      // This works around a bug in "force update on reload".
      var refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    };
  
    /**
     * @description Method to track service worker states
     */
    static trackInstalling(worker) {
      worker.addEventListener('statechange', function () {
        if (worker.state == 'installed') {
          AppHelper.updateReady(worker);
        }
      });
    };
  
    /**
     * @description Method to skip the waiting for service worker update
     */
    static updateReady(worker) {
      worker.postMessage({ action: 'skipWaiting' });
    };
  }