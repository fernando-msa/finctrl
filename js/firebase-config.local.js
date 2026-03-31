/**
 * Stub seguro para compatibilidade com deploys antigos que ainda carregam
 * `/js/firebase-config.local.js` no HTML.
 *
 * Não define credenciais por padrão. Apenas preserva eventual config já
 * injetada em `window.__FINCTRL_FIREBASE_CONFIG__`.
 */
window.__FINCTRL_FIREBASE_CONFIG__ = window.__FINCTRL_FIREBASE_CONFIG__ || undefined;
