// @vitest-environment jsdom
//
// Base compartida de RulesModal, ShareModal y LegendModal. Lo que se prueba
// aquí es justo lo que un modal compartido puede romper para sus tres
// usuarios a la vez: dejar de pintar cuando toca, no cerrar donde debe (o
// cerrar donde no debe) y esconder el botón de cerrar cuando nadie lo pidió.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalShell from './ModalShell.jsx'

const setup = (props = {}) =>
  render(
    <ModalShell open onClose={vi.fn()} ariaLabel="Modal de prueba" {...props}>
      <p>Contenido</p>
    </ModalShell>,
  )

describe('visibilidad', () => {
  it('no pinta nada mientras está cerrado', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('pinta el contenido cuando está abierto', () => {
    setup()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })
})

describe('cierre', () => {
  it('cierra al hacer clic en el fondo', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByRole('dialog').parentElement)
    expect(onClose).toHaveBeenCalled()
  })

  it('no cierra al hacer clic dentro del panel', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByText('Contenido'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('no cierra con Escape si closeOnEscape no está activado', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('cierra con Escape cuando closeOnEscape está activado', async () => {
    const onClose = vi.fn()
    setup({ onClose, closeOnEscape: true })
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('botón de cerrar', () => {
  it('no se muestra por defecto', () => {
    setup()
    expect(screen.queryByRole('button', { name: /cerrar/i })).not.toBeInTheDocument()
  })

  it('se muestra y cierra al pulsarlo cuando showCloseButton está activado', async () => {
    const onClose = vi.fn()
    setup({ onClose, showCloseButton: true })
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
