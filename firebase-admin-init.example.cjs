/**
 * Exemplo para inicialização do Firebase Admin SDK (somente backend).
 *
 * Uso:
 * 1) Baixe a chave de conta de serviço no Firebase Console.
 * 2) Salve como ./secrets/serviceAccountKey.json (NÃO commitar no Git).
 * 3) Execute em ambiente Node.js de servidor.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./secrets/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://finctrl-3e976-default-rtdb.firebaseio.com'
});

module.exports = admin;
