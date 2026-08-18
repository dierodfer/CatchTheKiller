// @vitest-environment jsdom
//
// El aviso pasivo de reparto completo pasa a ser la propia acción de resolver,
// justo donde cae la vista al soltar la última ficha.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import CharacterTray from './CharacterTray.jsx'

const characters = { suspects: ['Alba', 'Carla'], victim: 'Sergio' }

// `useDroppable` necesita un `DndContext` alrededor para no lanzar.
const renderTray = (props) =>
  render(
    <DndContext>
      <CharacterTray characters={characters} onTokenClick={vi.fn()} onCheck={vi.fn()} {...props} />
    </DndContext>,
  )

describe('reparto incompleto', () => {
  it('no ofrece resolver el caso', () => {
    renderTray({ placements: { Alba: { row: 0, col: 0 } } })
    expect(screen.queryByRole('button', { name: /Resolver el caso/ })).not.toBeInTheDocument()
  })
})

describe('reparto completo', () => {
  const allPlaced = {
    Alba: { row: 0, col: 0 },
    Carla: { row: 0, col: 1 },
    Sergio: { row: 0, col: 2 },
  }

  it('ofrece resolver el caso justo donde estaban las fichas', async () => {
    const onCheck = vi.fn()
    renderTray({ placements: allPlaced, onCheck })

    await userEvent.click(screen.getByRole('button', { name: /Resolver el caso/ }))
    expect(onCheck).toHaveBeenCalledTimes(1)
  })

  it('ya no muestra el aviso pasivo de reparto completo', () => {
    renderTray({ placements: allPlaced })
    expect(screen.queryByText(/Todo el reparto está en la escena/)).not.toBeInTheDocument()
  })
})
