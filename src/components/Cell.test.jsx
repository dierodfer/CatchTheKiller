// @vitest-environment jsdom
//
// Celda del tablero. Se prueban las reglas de RENDER que no se ven en la
// lógica del juego y que ningún test de `src/game/` puede cazar: qué capas se
// pintan y cuáles no según el estado de la casilla.
//
// Son justo las que se rompen al retocar el aspecto — la celda de alfombra
// dejando de ser transparente, o el aspa de control quedándose bajo una ficha.

import { describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cell from './Cell.jsx'
import { ZONES } from './zones.js'

const zone = ZONES.montana
const characters = { suspects: ['Alba', 'Carla'], victim: 'Sergio' }

const geometry = (over = {}) => ({
  r: 1,
  c: 2,
  size: 80,
  tint: 'rgb(10, 20, 30)',
  roomName: 'Cocina',
  borders: { top: 'none', right: 'none', bottom: 'none', left: 'none' },
  label: undefined,
  furniture: null,
  isWindow: false,
  wall: undefined,
  occupiable: true,
  ...over,
})

const setup = ({ geometry: geoOver, ...props } = {}) =>
  render(
    <Cell
      zone={zone}
      characters={characters}
      occupantName={undefined}
      controlled={false}
      revealCell={false}
      selectedToken={null}
      onCellClick={vi.fn()}
      onTokenClick={vi.fn()}
      revealMode={false}
      marks={{}}
      markingCell={null}
      onMarkToggle={vi.fn()}
      onMarkOpen={vi.fn()}
      onMarkClose={vi.fn()}
      {...props}
      geometry={geometry(geoOver)}
    />,
  )

const cellEl = () => document.querySelector('[data-rc="1-2"]')

describe('accesibilidad e interacción', () => {
  it('expone la casilla como botón con su fila y columna', () => {
    setup()
    // 1-indexado de cara al jugador, aunque internamente sea 0-indexado.
    expect(screen.getByRole('button', { name: /fila 2, columna 3/i })).toBeInTheDocument()
  })

  it('anuncia también quién la ocupa', () => {
    setup({ occupantName: 'Alba' })
    expect(screen.getByRole('button', { name: /fila 2, columna 3, Alba/i })).toBeInTheDocument()
  })

  it('una celda no ocupable no es interactiva', () => {
    setup({ geometry: { occupiable: false } })
    expect(screen.queryByRole('button', { name: /fila 2/i })).not.toBeInTheDocument()
  })

  it('en modo revelación no se puede interactuar', () => {
    setup({ revealMode: true })
    expect(screen.queryByRole('button', { name: /fila 2/i })).not.toBeInTheDocument()
  })

  it('al pulsar con una ficha seleccionada la coloca', async () => {
    const onCellClick = vi.fn()
    setup({ selectedToken: 'Alba', onCellClick })
    await userEvent.click(screen.getByRole('button', { name: /fila 2/i }))
    expect(onCellClick).toHaveBeenCalledWith(1, 2)
  })

  it('al pulsar sin ficha seleccionada abre el marcado', async () => {
    const onMarkOpen = vi.fn()
    setup({ onMarkOpen })
    await userEvent.click(screen.getByRole('button', { name: /fila 2/i }))
    expect(onMarkOpen).toHaveBeenCalledWith(1, 2)
  })
})

describe('capas de la celda', () => {
  it('la celda de alfombra no pinta fondo propio', () => {
    // Si lo pintara taparía la capa de alfombra, que va por detrás (ver Rug.jsx).
    setup({ geometry: { furniture: 'alfombra' } })
    expect(cellEl()).toHaveStyle({ background: 'transparent' })
  })

  it('una celda normal pinta el tinte de su habitación', () => {
    setup()
    expect(cellEl()).toHaveStyle({ background: 'rgb(10, 20, 30)' })
  })

  it('no dibuja mobiliario sobre la alfombra', () => {
    // La alfombra es "mobiliario" en el grid, pero la dibuja la capa del tablero.
    const { container } = setup({ geometry: { furniture: 'alfombra' } })
    expect(container.querySelector('img')).toBeNull()
  })

  it('oculta el mobiliario cuando hay una ficha encima', () => {
    // En esta zona el mueble es un <img> (sprite de Kenney) y la ficha un
    // <svg>, así que se consulta el <img> concreto y no "cualquier gráfico".
    const sinFicha = setup({ geometry: { furniture: 'mesa' } })
    expect(sinFicha.container.querySelector('img')).toBeInTheDocument()
    cleanup()

    const conFicha = setup({ geometry: { furniture: 'mesa' }, occupantName: 'Alba' })
    // La ficha sustituye al mueble, no se apila encima.
    expect(conFicha.container.querySelector('img')).toBeNull()
  })

  it('marca la casilla seleccionada con un contorno', () => {
    setup({ markingCell: { r: 1, c: 2 } })
    expect(cellEl().style.outline).not.toBe('none')
  })

  it('no la marca si la seleccionada es otra', () => {
    setup({ markingCell: { r: 0, c: 0 } })
    expect(cellEl().style.outline).toBe('none')
  })

  it('una celda void no pinta nada interactivo', () => {
    const { container } = setup({ geometry: { isVoid: true } })
    expect(container.querySelector('[data-rc]')).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('anotaciones de candidatos', () => {
  it('muestra la inicial de cada candidato marcado', () => {
    setup({ marks: { '1,2': ['Alba', 'Carla'] } })
    expect(screen.getByTitle('Alba')).toBeInTheDocument()
    expect(screen.getByTitle('Carla')).toBeInTheDocument()
  })

  it('sigue mostrándolas aunque haya una ficha colocada', () => {
    // Son el razonamiento del jugador, no el estado del tablero.
    setup({ marks: { '1,2': ['Alba'] }, occupantName: 'Carla' })
    expect(screen.getByTitle('Alba')).toBeInTheDocument()
  })

  it('no pinta nada si la casilla no tiene marcas', () => {
    setup({ marks: {} })
    expect(screen.queryByTitle('Alba')).not.toBeInTheDocument()
  })
})
