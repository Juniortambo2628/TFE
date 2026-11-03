// The booking path on a phone (UX review 2 Nov 2026, plan item B6): planner →
// sign-up → (email verification) → booking → pay, as a brand-new guest. Each
// screen is screenshotted and audited for sideways scroll, elements wider than
// the screen, fields under 16px (iOS zooms on focus), small tap targets, and
// whether the screen's main action is on screen and not covered.
//
//   node scripts/booking-path-walk.mjs <label> [width] [height]
//     → docs/meetings/shots/booking-path/<label>/
//
// Env: E2E_BASE_URL (default http://127.0.0.1:8000), PW_CHROMIUM_PATH.
// Locally (APP_ENV=local) accounts count as verified and payment runs in demo
// mode. To walk the production path — the verify-email step, and no in-app
// payment without a Paystack key — serve a second copy with APP_ENV=staging
// (a process variable beats .env) and point E2E_BASE_URL at it. The
// verification link is read from storage/logs/laravel.log (MAIL_MAILER=log).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [,, label='before', W='390', H='760'] = process.argv;
const out = `docs/meetings/shots/booking-path/${label}`; await import('node:fs').then(f => f.mkdirSync(out, { recursive: true }));
const B = (process.env.E2E_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const b = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const ctx = await b.newContext({ viewport:{width:+W,height:+H}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await ctx.addInitScript(() => { try { localStorage.setItem('privacy_consent','true'); localStorage.removeItem('tfe.planner.v1'); sessionStorage.setItem('tfeIntroShown','1'); } catch {} });
const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
let n=0;
async function audit(name, primary) {
  await p.waitForTimeout(700);
  const r = await p.evaluate((primary) => {
    const vw = innerWidth, vh = innerHeight; const issues = [];
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`page scrolls sideways (${document.documentElement.scrollWidth}px)`);
    const wide = [...document.querySelectorAll('body *')].filter(e => { const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0 && r.right > vw + 2 && cs.position!=='fixed' && !e.closest('[style*="overflow"]') && getComputedStyle(e.parentElement).overflowX==='visible'; }).slice(0,4).map(e => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0,2).join('.')} → ${Math.round(e.getBoundingClientRect().right)}px`);
    if (wide.length) issues.push('wider than screen: ' + wide.join(', '));
    const small = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea')].filter(e => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 16).map(e => `${e.name||e.type} ${getComputedStyle(e).fontSize}`);
    if (small.length) issues.push('fields under 16px (iOS zooms on focus): ' + [...new Set(small)].join(', '));
    const tiny = [...document.querySelectorAll('button, a[href], input[type=checkbox], [role=button]')].filter(e => { const r=e.getBoundingClientRect(); return e.offsetParent && r.width>0 && r.top < vh && r.bottom > 0 && (r.height < 32 || r.width < 32) && !e.closest('.tfe-backnav__trail') && !e.closest('footer'); }).slice(0,5).map(e => `${(e.innerText||e.getAttribute('aria-label')||e.type||'').trim().slice(0,24)||e.tagName} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
    if (tiny.length) issues.push('small tap targets on screen: ' + tiny.join(' | '));
    if (primary) {
      const el = [...document.querySelectorAll('button, a')].find(e => e.offsetParent && new RegExp(primary,'i').test(e.innerText));
      if (!el) issues.push(`primary "${primary}" not found`);
      else { const r = el.getBoundingClientRect(); const vis = r.top >= 0 && r.bottom <= vh;
        const top = vis ? document.elementFromPoint(r.left + r.width/2, r.top + r.height/2) : null;
        if (!vis) issues.push(`primary "${primary}" off-screen (y ${Math.round(r.top)}-${Math.round(r.bottom)} of ${vh})`);
        else if (top && !el.contains(top) && top !== el) issues.push(`primary "${primary}" covered by ${top.tagName.toLowerCase()}.${String(top.className).split(' ')[0]}`); }
    }
    return issues;
  }, primary);
  const file = `${String(++n).padStart(2,'0')}-${name}.jpg`;
  await p.screenshot({ path: `${out}/${file}`, type:'jpeg', quality:76 });
  console.log(`${file.padEnd(28)} ${p.url().replace(B,'')}\n   ${r.length ? r.join('\n   ') : 'ok'}`);
}
await p.goto(B+'/'); await p.waitForLoadState('networkidle').catch(()=>{});
await p.locator('.tfe-tabbar__item--primary').click(); await p.waitForSelector('.tfe-modal'); await p.waitForTimeout(1200);
await audit('planner-matches', 'Next');
await p.getByRole('button', { name: /^Next$/ }).click(); await audit('planner-trip', 'See my estimate');
await p.getByRole('button', { name: /See my estimate/ }).click(); await audit('planner-estimate', 'Save plan|Finalize');
// pick the first bookable package if offered
const pkg = p.locator('.tfe-modal input[type=radio], .tfe-modal [role=radio], .tfe-modal .tfe-planner-package button').first();
if (await pkg.count()) { await pkg.click().catch(()=>{}); await audit('planner-package-picked', 'Finalize|Save plan'); }
await p.locator('.tfe-modal__foot button').filter({ hasText: /Finalize|Save plan/ }).first().click();
await p.waitForURL(/register|login/, { timeout: 15000 }); await p.waitForLoadState('networkidle').catch(()=>{});
await audit('register-1', 'Next');
const email = `walk${Date.now()}@example.com`;
const txt = p.locator('form input[type=text]'); await txt.nth(0).fill('Wanjiru'); await txt.nth(1).fill('Kamau');
await p.fill('form input[type=email]', email); await p.locator('input[type=email]').blur(); await p.waitForTimeout(800);
const pw = p.locator('form input[type=password]'); await pw.nth(0).fill('Sup3r-secret-pass'); await pw.nth(1).fill('Sup3r-secret-pass');
await audit('register-1-filled', 'Next');
await p.getByRole('button', { name: /Next/ }).click(); await audit('register-consent', 'Create|Register|Sign up|Complete');
await p.check('#terms'); await p.locator('button[type=submit]').click();
await p.waitForURL(u => !/register/.test(u.pathname), { timeout: 20000 }); await p.waitForLoadState('networkidle').catch(()=>{});
const onBooking = /\/fan\/bookings\//.test(p.url());
await audit('after-register', onBooking ? 'Pay' : 'Resend|verif');
if (!onBooking) {
// follow the verification link from the mail log
const log = readFileSync('storage/logs/laravel.log', 'utf8');
// Verification links in the mail log, for this server, newest last.
const links = log.split(/[\s"<>()\[\]]+/).filter((t) => t.startsWith(`${B}/verify-email/`)).map((t) => t.replace(/&amp;/g, '&'));
const link = links.at(-1); console.log('   verify link found:', !!link);
await p.goto(link); await p.waitForLoadState('networkidle').catch(()=>{});
await audit('after-verify', 'Pay|Accept|Save');
}
await p.evaluate(() => window.scrollTo(0, 99999)); await audit('booking-bottom', 'Pay');
const pay = p.locator('.tfe-mobile-actionbar button, .tfe-mobile-actionbar a').filter({ hasText: /Pay/ }).first();
if (await pay.count()) { await pay.click(); await p.waitForTimeout(800); await audit('pay-tapped', 'Pay|Confirm|M-Pesa|Card'); }
console.log('URL at end:', p.url().replace(B,''), errs.length ? 'ERRORS '+errs.join(' | ') : '');
await b.close();
