const PIECE_IDS = [
  'pieza_01',
  'pieza_02',
  'pieza_03',
  'pieza_04',
  'pieza_05',
  'pieza_06',
  'pieza_07',
  'pieza_08',
  'pieza_09',
  'pieza_10',
  'pieza_11',
  'pieza_12',
]

export const MOTOR_D17A2_PIECES = PIECE_IDS.map((id, index) => ({
  id,
  label: `Pieza ${String(index + 1).padStart(2, '0')}`,
}))

export const MOTOR_D17A2_PIECES_BY_ID = Object.fromEntries(
  MOTOR_D17A2_PIECES.map(piece => [piece.id, piece]),
)
