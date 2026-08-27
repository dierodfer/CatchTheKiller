// @vitest-environment jsdom
//
// Leyenda del tablero. Lo que se prueba aquí es justo lo que una leyenda puede
// romper sin que nadie se entere: quedarse desincronizada del registro de
// elementos (un elemento nuevo que no aparece, o uno que aparece en el lado
// equivocado) y quedarse desincronizada de la zona (nombres de la ambientación
// base en una partida de la casa de montaña).

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LegendModal from './LegendModal.jsx'
import { ZONES } from './zones.js'
import { BLOCKING_ELEMENTS, FREE_ELEMENTS } from '@/game/elements.js'
import { resolveElements } from '@/game/zones.js'

// Nombres resueltos de la zona por defecto de los tests (`pixel` no re-tematiza
// ningún elemento, así que coinciden con los del registro base).
const ELEMENTS_PIXEL = resolveElements('pixel')

const setup = (props = {}) =>
  render(<LegendModal open onClose={vi.fn()} zone={ZONES.pixel} {...props} />)

// Las dos listas de la leyenda, en el orden en que salen en el DOM.
const sectionItems = (title) => {
  const heading = screen.getByRole('heading', { name: new RegExp(title, 'i') })
  const list = within(heading.closest('section')).getAllByRole('listitem')
  return list.map((li) => li.textContent)
}

describe('contenido', () => {
  it('no pinta nada mientras está cerrada', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lista TODOS los elementos ocupables del registro', () => {
    setup()
    const items = sectionItems('sí se pueden ocupar')
    expect(items).toHaveLength(FREE_ELEMENTS.length)
    for (const id of FREE_ELEMENTS) {
      expect(items.some((text) => text.includes(ELEMENTS_PIXEL[id].label))).toBe(true)
    }
  })

  it('lista TODOS los elementos bloqueantes del registro', () => {
    setup()
    const items = sectionItems('no se pueden ocupar')
    expect(items).toHaveLength(BLOCKING_ELEMENTS.length)
    for (const id of BLOCKING_ELEMENTS) {
      expect(items.some((text) => text.includes(ELEMENTS_PIXEL[id].label))).toBe(true)
    }
  })

  it('acompaña cada elemento ocupable de la frase con que lo nombran las pistas', () => {
    setup()
    for (const id of FREE_ELEMENTS) {
      expect(screen.getByText(`«${ELEMENTS_PIXEL[id].onText}»`)).toBeInTheDocument()
    }
  })

  it('marca como mueble solo los elementos que lo son', () => {
    setup()
    const tags = screen.getAllByText('mueble')
    const muebles = [...FREE_ELEMENTS, ...BLOCKING_ELEMENTS].filter(
      (id) => ELEMENTS_PIXEL[id].mueble,
    )
    expect(tags).toHaveLength(muebles.length)
  })
})

describe('ambientación', () => {
  const ELEMENTS_MONTANA = resolveElements('montana')

  it('usa los nombres de la zona, no los del registro base', () => {
    setup({ zone: ZONES.montana })
    // En la casa de montaña, `planta` es una chimenea y `TV` una cómoda.
    expect(screen.getByText(ELEMENTS_MONTANA.planta.label)).toBeInTheDocument()
    expect(screen.getByText(ELEMENTS_MONTANA.TV.label)).toBeInTheDocument()
    expect(screen.queryByText('planta')).not.toBeInTheDocument()
  })

  it('nombra la ambientación activa', () => {
    setup({ zone: ZONES.montana })
    expect(screen.getByText(ZONES.montana.label)).toBeInTheDocument()
  })

  it('nombra en la nota al pie los elementos que NO cuentan como mueble, con el nombre de la zona', () => {
    setup({ zone: ZONES.montana })
    // "chimenea" (planta re-tematizada) y "alfombra" son los dos no-muebles.
    expect(screen.getByText(/no cuentan como tal/i)).toHaveTextContent(
      ELEMENTS_MONTANA.planta.label,
    )
    expect(screen.getByText(/no cuentan como tal/i)).toHaveTextContent(
      ELEMENTS_MONTANA.alfombra.label,
    )
  })
})

describe('cierre', () => {
  it('se cierra con Escape', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('se cierra con el botón de cerrar', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('no se cierra al pulsar dentro del panel', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByRole('heading', { name: /elementos del tablero/i }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
