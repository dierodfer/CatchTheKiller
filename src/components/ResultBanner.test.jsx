// @vitest-environment jsdom
//
// El desenlace fallido es el único sitio donde el juego le da información al
// jugador sobre lo que ha hecho mal, y la regla es estricta: cuántos
// testimonios contradice, jamás cuáles. Si eso se relaja, el caso se resuelve
// probando en vez de deduciendo.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultBanner from './ResultBanner.jsx'

const characters = { suspects: ['Alba', 'Carla'], victim: 'Sergio' }

const renderBanner = (status, result) =>
  render(
    <ResultBanner
      status={status}
      result={result}
      characters={characters}
      onClose={vi.fn()}
      onBackToPlay={vi.fn()}
      onNewGame={vi.fn()}
    />,
  )

describe('caso no resuelto correctamente', () => {
  it('lo dice como error y cuenta los testimonios contradichos', () => {
    renderBanner('fail', { solved: false, complete: true, errorCount: 3 })

    expect(screen.getByText('El caso no está resuelto correctamente')).toBeInTheDocument()
    expect(screen.getByText('3 testimonios')).toBeInTheDocument()
  })

  it('singulariza un único testimonio', () => {
    renderBanner('fail', { solved: false, complete: true, errorCount: 1 })
    expect(screen.getByText('1 testimonio')).toBeInTheDocument()
  })

  it('no revela ni el asesino ni la habitación', () => {
    renderBanner('fail', { solved: false, complete: true, errorCount: 2 })
    for (const name of [...characters.suspects, characters.victim]) {
      expect(screen.queryByText(new RegExp(name))).not.toBeInTheDocument()
    }
  })

  it('deja seguir intentándolo, y no ofrece empezar un caso nuevo', () => {
    // Sin "Nuevo caso": esa es una vía de escape que evita corregir el error,
    // y el punto de un FAIL es forzar a seguir deduciendo sobre este caso.
    renderBanner('fail', { solved: false, complete: true, errorCount: 2 })
    expect(screen.getByRole('button', { name: /Seguir intentando/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nuevo caso/ })).not.toBeInTheDocument()
  })

  it('no explica qué hacer a continuación: el número basta', () => {
    // La frase "cuáles son y dónde está el fallo tendrás que deducirlo tú" se
    // quitó por larga; el título ya dice que es un error y el recuento ya
    // dice cuánto de mal, no hace falta una tercera frase.
    renderBanner('fail', { solved: false, complete: true, errorCount: 2 })
    expect(screen.queryByText(/deducirlo tú/)).not.toBeInTheDocument()
    expect(screen.queryByText(/solución no se revela/)).not.toBeInTheDocument()
  })

  it('sin errores de pista, culpa al reparto sin un único culpable', () => {
    // Camino defensivo: hoy el generador garantiza solución única, así que
    // errorCount 0 implicaría ganar. Si esa invariante cayera, el jugador
    // seguiría leyendo algo cierto en vez de "contradice 0 testimonios".
    renderBanner('fail', { solved: false, complete: true, errorCount: 0 })
    expect(screen.getByText(/no señala a un único culpable/)).toBeInTheDocument()
  })
})

describe('caso resuelto', () => {
  it('nombra al asesino y la habitación', () => {
    renderBanner('win', { solved: true, complete: true, killer: 'Alba', room: 'Cocina' })

    expect(screen.getByText('¡Caso resuelto!')).toBeInTheDocument()
    expect(screen.getByText('Alba')).toBeInTheDocument()
    expect(screen.getByText('Cocina')).toBeInTheDocument()
  })

  it('distingue haber pedido la solución de haberla deducido', () => {
    renderBanner('win', { solved: true, revealed: true, killer: 'Alba', room: 'Cocina' })
    expect(screen.getByText('Solución revelada')).toBeInTheDocument()
  })

  it('ofrece un caso nuevo, y no "seguir intentando" (ya terminó)', () => {
    renderBanner('win', { solved: true, complete: true, killer: 'Alba', room: 'Cocina' })
    expect(screen.getByRole('button', { name: /Nuevo caso/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Seguir intentando/ })).not.toBeInTheDocument()
  })
})
