// @vitest-environment jsdom
//
// El botón principal cambia de significado según el estado: un descuido y el
// jugador acaba revelando la solución cuando quería dictar veredicto, un clic
// sin vuelta atrás.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from './Toolbar.jsx'

const handlers = () => ({
  onCheck: vi.fn(),
  onReveal: vi.fn(),
  onNewGame: vi.fn(),
  onShowRules: vi.fn(),
  onShare: vi.fn(),
})

const renderToolbar = (props = {}) => {
  const h = handlers()
  render(<Toolbar placedCount={0} totalCount={4} {...h} {...props} />)
  return h
}

describe('escena incompleta', () => {
  it('ofrece ver la solución, no resolver', async () => {
    const h = renderToolbar({ allPlaced: false, placedCount: 1 })

    expect(screen.queryByRole('button', { name: /Resolver el caso/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Ver la solución/ }))

    expect(h.onReveal).toHaveBeenCalledTimes(1)
    expect(h.onCheck).not.toHaveBeenCalled()
  })

  it('dice cuántos faltan por situar', () => {
    renderToolbar({ allPlaced: false, placedCount: 1 })
    expect(screen.getByText('Faltan 3 personajes por situar en la escena.')).toBeInTheDocument()
  })

  it('singulariza el último que falta', () => {
    renderToolbar({ allPlaced: false, placedCount: 3 })
    expect(screen.getByText('Falta 1 personaje por situar en la escena.')).toBeInTheDocument()
  })
})

describe('escena completa', () => {
  it('resuelve el caso, y ya no ofrece ver la solución', async () => {
    const h = renderToolbar({ allPlaced: true, placedCount: 4 })

    // Con todo el reparto situado, la única salida es dictar veredicto: mirar
    // la solución deja de estar a un clic.
    expect(screen.queryByRole('button', { name: /Ver la solución/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Resolver el caso/ }))

    expect(h.onCheck).toHaveBeenCalledTimes(1)
    expect(h.onReveal).not.toHaveBeenCalled()
  })
})

describe('el botón de Resolución ya no existe', () => {
  it('no queda ningún botón con ese nombre en ninguno de los dos estados', () => {
    for (const allPlaced of [true, false]) {
      const { unmount } = render(
        <Toolbar allPlaced={allPlaced} placedCount={0} totalCount={4} {...handlers()} />,
      )
      expect(screen.queryByRole('button', { name: /^Resolución$/ })).not.toBeInTheDocument()
      unmount()
    }
  })
})

describe('acciones secundarias', () => {
  it('siguen disponibles con la escena a medias', async () => {
    const h = renderToolbar({ allPlaced: false })
    await userEvent.click(screen.getByRole('button', { name: /Nuevo/ }))
    await userEvent.click(screen.getByRole('button', { name: /Reglas/ }))
    await userEvent.click(screen.getByRole('button', { name: /Compartir/ }))

    expect(h.onNewGame).toHaveBeenCalledTimes(1)
    expect(h.onShowRules).toHaveBeenCalledTimes(1)
    expect(h.onShare).toHaveBeenCalledTimes(1)
  })
})
