// Versión de la app: se lee directamente de `package.json` para tener una
// única fuente de verdad (nadie tiene que acordarse de repetirla a mano en la
// UI cada vez que se publica una release).
import pkg from '../package.json'

export const APP_VERSION = pkg.version
