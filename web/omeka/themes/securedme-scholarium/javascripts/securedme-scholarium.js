(function () {
  function markExternalLinks() {
    var host = window.location.hostname;
    document.querySelectorAll('a[href^="http"]').forEach(function (link) {
      try {
        var url = new URL(link.href);
        if (url.hostname !== host) {
          link.rel = 'noopener noreferrer';
        }
      } catch (error) {
        return;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markExternalLinks);
  } else {
    markExternalLinks();
  }
})();
