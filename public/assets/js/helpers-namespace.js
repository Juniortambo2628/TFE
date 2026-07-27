// Bridge to expose reusable form helpers under a single namespace
(function () {
  if (window.FormHelpers) return;

  window.FormHelpers = {
    SmartDefaults: window.SmartDefaults || null,
    MicroInteractions: window.MicroInteractions || null,
    SearchableDropdown: window.SearchableDropdown || null,
    FormStateManager: window.FormStateManager || null,
    resolve(name) {
      return this[name] || window[name] || null;
    },
  };
})();
