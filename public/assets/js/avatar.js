// Lightweight DiceBear avatar creator integration
(function () {
  const apiProfile = '/TFE/api/profile.php';
  function $(s) {
    return document.querySelector(s);
  }

  function buildUrl(style, seed, traits) {
    let base = `https://avatars.dicebear.com / api / ${encodeURIComponent(style)} / ${encodeURIComponent(seed)}.svg`;
    if (!traits) {
      return base;
    }
    const params = [];
    // map trait keys to query params depending on style (we use simple naming)
    Object.keys(traits).forEach(k => {
      if (traits[k]) {
        params.push(`${encodeURIComponent(k)} = ${encodeURIComponent(traits[k])}`);
      }
    });
    if (params.length) {
      base += '?' + params.join('&');
    }
    return base;
  }

  async function fetchSvg(url) {
    const r = await fetch(url);
    return await r.text();
  }

  function setPreview(svg) {
    const p = $('#avatarPreview');
    if (!p) {
      return;
    }
    // place svg
    p.innerHTML = svg;
    // set download link
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = $('#avatarDownload');
    if (a) {
      a.href = url;
    }
  }

  function randomSeed() {
    return 'user' + Math.floor(Math.random() * 1000000);
  }

  async function updatePreview() {
    const style = $('#avatarStyle').value;
    let seed = $('#avatarSeed').value.trim();
    if (!seed) {
      seed = randomSeed();
    }
    const traits = {
      hair: (document.getElementById('traitHair') || {}).value || null,
      eyes: (document.getElementById('traitEyes') || {}).value || null,
      mouth: (document.getElementById('traitMouth') || {}).value || null,
      clothes: (document.getElementById('traitClothes') || {}).value || null,
    };
    const url = buildUrl(style, seed, traits);
    try {
      const svg = await fetchSvg(url);
      setPreview(svg);
    } catch (e) {
      console.warn('Avatar fetch failed', e);
    }
  }

  async function saveAvatar() {
    const svgContainer = $('#avatarPreview');
    if (!svgContainer) {
      return;
    }
    const svg = svgContainer.innerHTML;
    const rasterize = document.getElementById('avatarRasterize')?.checked ? '1' : '0';
    // post to server
    const fd = new FormData();
    fd.append('action', 'save_svg_avatar');
    fd.append('svg', svg);
    fd.append('rasterize', rasterize);
    try {
      const res = await fetch(apiProfile, { method: 'POST', body: fd });
      const txt = await res.text();
      const data = JSON.parse(txt);
      if (data.success && data.avatar_path) {
        const img = document.getElementById('profileAvatar');
        if (img) {
          img.src = data.avatar_path;
        }
        alert('Avatar saved');
        $('#avatarCreatorModal').classList.remove('open');
      } else {
        alert(data.message || 'Save failed');
      }
    } catch (e) {
      console.warn(e);
      alert('Save failed');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const openBtn = document.getElementById('openAvatarCreator');
    const modal = document.getElementById('avatarCreatorModal');
    const close = document.getElementById('avatarCreatorClose');
    const styleSel = document.getElementById('avatarStyle');
    const seedInput = document.getElementById('avatarSeed');
    const randBtn = document.getElementById('avatarRandomize');
    const saveBtn = document.getElementById('avatarSave');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        updatePreview();
        // focus the seed input
        const seedEl = modal.querySelector('#avatarSeed');
        if (seedEl) {
          seedEl.focus();
        }
        trapFocus(modal);
      });
    }
    if (close && modal) {
      close.addEventListener('click', () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        openBtn.focus();
        releaseFocusTrap();
      });
    }
    if (styleSel) {
      styleSel.addEventListener('change', updatePreview);
    }
    if (seedInput) {
      seedInput.addEventListener('input', updatePreview);
    }
    if (randBtn) {
      randBtn.addEventListener('click', () => {
        seedInput.value = randomSeed();
        updatePreview();
      });
    }
    // trait controls
    ['traitHair', 'traitEyes', 'traitMouth', 'traitClothes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', updatePreview);
      }
    });
    if (saveBtn) {
      saveBtn.addEventListener('click', saveAvatar);
    }

    // ESC to close modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        openBtn.focus();
        releaseFocusTrap();
      }
    });
  });

  // Simple focus trap implementation
  let _trap = null;
  function trapFocus(modal) {
    const focusable = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(modal.querySelectorAll(focusable)).filter(
      n => !n.hasAttribute('disabled')
    );
    if (nodes.length === 0) {
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    _trap = function (e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', _trap);
  }
  function releaseFocusTrap() {
    if (_trap) {
      document.removeEventListener('keydown', _trap);
      _trap = null;
    }
  }
})();
