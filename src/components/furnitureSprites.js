// Sprites de mobiliario — recortados de "Roguelike/RPG pack" (Kenney, CC0 1.0).
//
// Cada valor es un tile de 16×16 px, en PNG, como data URI: mismo tratamiento
// que `floorSprites.js`, y por el mismo motivo — la app es una PWA offline y
// no puede depender de una descarga en tiempo de ejecución.
// Licencia CC0: texto de cortesía en
// `LICENSES/kenney-roguelike-rpg-pack-CC0.txt` (la CC0 no exige atribución).
//
// Indexado por ZONA y luego por el id ESTABLE del elemento (game/elements.js),
// no por su nombre en pantalla: en `montana` la entrada `TV` es un cómoda de
// madera y `planta` una chimenea (ver ZONE_ELEMENTS en game/zones.js) — el
// sprite sigue la ambientación, la clave sigue la lógica.
//
// Las zonas `montana` y `apartamento` tienen mobiliario propio, sin compartir
// sprites entre sí ni tintarlos por CSS: la variedad de dibujo (silla con
// cojín vs. taburete gris, chimenea vs. dispositivo con pantalla…) es
// precisamente lo que les da personalidad. La zona `pixel` no está aquí:
// conserva su propio pixel art (pixelSprites.js).

export const KENNEY_FURNITURE_SPRITES = {
  montana: {
    mesa: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAe0lEQVR4AaXBsQ3CMBRF0esv75EmVTagQIRpSOlNSOltsETBBq4sJFfUTGCMlBqhvHNcaw2FITJEhsgQGSJDZIgMkbteTg2Bpzscz+zxuN8wRIbI071fT/bydLlUpnEgl8o/pnEgl8qXDzG5dZkbmxCT44d1mRubEJP7AC15HWrdWdduAAAAAElFTkSuQmCC',
    TV: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAqUlEQVR4AaXBMQrCMBSA4b/l7ZkzFUKn3qCDqKfR0Zvo6G0UHLxBpxLolDkniAYivK22/b4qpcQW1fW0T2wgfPW7I2u8Xw9qNqrZSPiKwbOWUBjrWCIGTyYoMXi0YZzIurZBM9bxIyjGOrTeOuYIRQyeNYTCWMcSMXgyQYnBow3jRNa1DZqxjh9BMdah9dYxRyhi8KwhFMM4sUTXNmSCcrk/K/5wOx8SxQczACsGxYW+sQAAAABJRU5ErkJggg==',
    planta: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA50lEQVR4AaXBsUrDQBjA8X+Oy97AzS5BfYC61Kf4HsAtk3sIKF11KM5CcXe+N9DNRyhFcLjFUT98gLPRFI6QtmJ+vyzGyBiGkQwjWXYQkUjCe58xwNIjIpENVSUlIpEN731GwpAQkaiqqCp9qoqqIiKRhGEkQ0dEoqpyiKoiIpGO4YDKBfax7FC5QFnkXL8esY9hQOUCZZEzq9fcHr/TqlxgiKGncoGLmzdaL3enzOo1T8tnyiKncoE+S+L+4ZHWCpg0/Fjxa9LAFJgCV/UlW5ZOM1/w8fnFXzTzBVuWzvnZScY/GEb6BpjnSWixaX1XAAAAAElFTkSuQmCC',
    'estantería': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiUlEQVR4AaXBoQ6CUBSA4f8ejwbGeAu7lcCEp5Hom0j0ccwmZnNs1ktyI2hFDWy3cMc83+dOh/14PF8cM5q6HIlQFsiLitBzePFzv11Rvpq6HPmT5kVFzOAfxAhGgpFgpCyQpBkht9owURbwXUuof6+ZCEaapBkxyXaH71rmqO9aLAQjwUgwEow+vGgcULV6EXkAAAAASUVORK5CYII=',
    silla: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAjElEQVR4AaXBsQ2CQBSA4f9eXm9tZUKs3MDCgGOwASWjULKBY4ixcAMrQkJFzQKeDcXlchrI+z7nvcdCMBKMlEBTFZ4V6rZzLJTI+XLln9fzTkiJzNPAFoKRYCQYKZHdPuPzuJEieQn9SEgwEoyUBMlL1lIi8zSwhZLw7kdSTscDMeWHuu0cgaYqPAlfmwEcOsDE5FAAAAAASUVORK5CYII=',
    cama: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmUlEQVR4AaXBMQ7BUBjA8X+/PDaDpZvECSy9Ai7gFnZzD2NxBiy2dugo4QLWyqukQnj6opJu1Xy/X+CcQ0NQEpQEJUEpWMWxozY5rmkzXCzxDqcCz1CZzuZ4g8uGNuMowuuN+ux3WwQlQUlQEpQMHT3KK18hnqGjcxHSZKjk1uI9yxdtbtbSJNSyNOEfWZqQpQk/hob8/qarD6SsJ1N3svg+AAAAAElFTkSuQmCC',
  },
  apartamento: {
    mesa: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmElEQVR4AaXBsQ3CMBBA0W/Le9BQsYELC3saXGYTXGYbIlGwQaoIKRU1ExyhQLKC0+TeMyKChkXJomRRMtfLWVBwLHxI7GVRsihZlCxKjsX79WQvx2KcZlpOxwNf4zSzxXX9YGgoOQqVrh8MDY6VkqPQUHIUFl0/GCqWSslRfEj4kPAh8eNDwoeED4mSo1BxrDzuN/5MM1s+344nGj3A4WQAAAAASUVORK5CYII=',
    TV: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAoUlEQVR4AaXBwUlFMRCG0S8hDaSFaeHi1hYsQEhxA7ZgAW9rC/K3MCXEjYs45D6EnFPmnJyoHKocqhyqHGokY4zJE+5eWDQWY4x5XRfPjDGmuxd+NTYigp3eO1njxuPlndXr1wc7jSQi6L3z9v3JH70TEWSNRBJmxo4kskpiZkgik4SZkTU2zAxJrMyMncYNM+M/KocqC3cvkrgjCXcvLH4AoHE0F3CfP+oAAAAASUVORK5CYII=',
    planta: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA2UlEQVR4AaXB4YmDMBiA4TfhQwKh0CFcwHOlcwLXOCfITHILHPjbf4IEggTSCBVEuNbi86iUEldoLtJcpLlIOGi6OvGCa3vFjvDUdHUiKytearo6kbm2V2SarOnqVFZQVrxVVlBW0HR1IhMO5mkh+MjKWOHodi/YU98/X6msYJ4Wgo8YKwQfWRkr/Od2L/j7BWHHWGFlrHCWJpunhU3wkTPmaWGlOTBWeCf4yEbzgeAjK2OFjeYDxgpH2rW9GoeCcSg4axwKxqHAtb0SMtf2iqzp6sQJru0VTw8aM0YQg3daOAAAAABJRU5ErkJggg==',
    'estantería': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmklEQVR4AaXBsQ2CUBRA0cuT1p7CmhUIBRHiAu5gonuwAGu4AjHRwsKwgsVPrH5iZxjgyyMUhsSGd04UQsBCMBKMBCPBKGpO24BBzCAvKpZ43G8IRoJRzODjHUvFTNbPDtVJwnl3RDWXGtVJwnu/Ql37A6p+tSjBSDASjISZvKiYy4uKf2ImfZox8o4ah+rTjJF3lH6DKmn59QXshyJCvZqVeAAAAABJRU5ErkJggg==',
    silla: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAY0lEQVR4AaXBsQ2DQBREwXer68iBKQDckUm5mJKAAiBwLZZo4BskAofAzqSIwCFMwiRMwiRM6d11gSGzqZsXd0zjgDAJkzBlNt915S5hEqbM4bPMXPF4Vuwyf/pSEie0pQSHHx3SEmmlcq16AAAAAElFTkSuQmCC',
    cama: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAY0lEQVR4AaXBsQ2DQBREwXer68iBKQDckUm5mJKAAiBwLZZo4BskIicIdiZFBA5hEiZhEqb07rrAkNnUzYs7pnFAmIRJmIRJmIQps/muK3dlDp9l5orHs2KX+dOXkjjRlhIcfgmvEmk/g5JVAAAAAElFTkSuQmCC',
  },
}
