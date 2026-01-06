'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const EMPTY_CELL = 0

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  O: { shape: [[1, 1], [1, 1]], color: '#eab308' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
}

type TetrominoType = keyof typeof TETROMINOES

interface Piece {
  type: TetrominoType
  shape: number[][]
  x: number
  y: number
}

interface TetrisProps {
  onGameOver: (score: number) => void
}

export default function Tetris({ onGameOver }: TetrisProps) {
  const [board, setBoard] = useState<number[][]>(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL))
  )
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const gameRef = useRef<HTMLDivElement>(null)

  // Use refs to access current state in callbacks
  const boardRef = useRef(board)
  const currentPieceRef = useRef(currentPiece)
  const scoreRef = useRef(score)
  const levelRef = useRef(level)
  const nextPieceRef = useRef(nextPiece)

  useEffect(() => { boardRef.current = board }, [board])
  useEffect(() => { currentPieceRef.current = currentPiece }, [currentPiece])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => { nextPieceRef.current = nextPiece }, [nextPiece])

  const getRandomTetromino = useCallback((): TetrominoType => {
    const types = Object.keys(TETROMINOES) as TetrominoType[]
    return types[Math.floor(Math.random() * types.length)]
  }, [])

  const createPiece = useCallback((type: TetrominoType): Piece => {
    const shape = TETROMINOES[type].shape.map(row => [...row])
    return {
      type,
      shape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    }
  }, [])

  const isValidMove = useCallback((piece: Piece, boardState: number[][]): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x
          const newY = piece.y + y
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && boardState[newY][newX])) {
            return false
          }
        }
      }
    }
    return true
  }, [])

  const rotatePiece = useCallback((piece: Piece): Piece => {
    const newShape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse())
    return { ...piece, shape: newShape }
  }, [])

  const mergePieceToBoard = useCallback((piece: Piece, boardState: number[][]): number[][] => {
    const newBoard = boardState.map(row => [...row])
    const typeIndex = Object.keys(TETROMINOES).indexOf(piece.type) + 1
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = typeIndex
        }
      }
    }
    return newBoard
  }, [])

  const clearLines = useCallback((boardState: number[][]): { newBoard: number[][], linesCleared: number } => {
    const newBoard = boardState.filter(row => row.some(cell => cell === EMPTY_CELL))
    const linesCleared = BOARD_HEIGHT - newBoard.length
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL))
    }
    return { newBoard, linesCleared }
  }, [])

  const lockPiece = useCallback((piece: Piece, boardState: number[][]) => {
    const newBoard = mergePieceToBoard(piece, boardState)
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)

    let newScore = scoreRef.current
    let newLevel = levelRef.current

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * levelRef.current
      newScore += points
      setScore(newScore)
      setLines(prev => {
        const newLines = prev + linesCleared
        newLevel = Math.floor(newLines / 10) + 1
        setLevel(newLevel)
        return newLines
      })
    }

    setBoard(clearedBoard)

    if (nextPieceRef.current) {
      const newPiece = createPiece(nextPieceRef.current)
      if (!isValidMove(newPiece, clearedBoard)) {
        setGameOver(true)
        setGameStarted(false)
        onGameOver(newScore)
      } else {
        setCurrentPiece(newPiece)
        setNextPiece(getRandomTetromino())
      }
    }
  }, [mergePieceToBoard, clearLines, createPiece, isValidMove, getRandomTetromino, onGameOver])

  const startGame = useCallback(() => {
    const firstType = getRandomTetromino()
    const secondType = getRandomTetromino()
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL)))
    setCurrentPiece(createPiece(firstType))
    setNextPiece(secondType)
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setIsPaused(false)
    setGameStarted(true)
    gameRef.current?.focus()
  }, [createPiece, getRandomTetromino])

  const dropPiece = useCallback(() => {
    const piece = currentPieceRef.current
    const boardState = boardRef.current
    if (!piece || gameOver || isPaused) return

    const newPiece = { ...piece, y: piece.y + 1 }

    if (isValidMove(newPiece, boardState)) {
      setCurrentPiece(newPiece)
    } else {
      lockPiece(piece, boardState)
    }
  }, [gameOver, isPaused, isValidMove, lockPiece])

  const movePiece = useCallback((dx: number) => {
    const piece = currentPieceRef.current
    if (!piece || gameOver || isPaused) return
    const newPiece = { ...piece, x: piece.x + dx }
    if (isValidMove(newPiece, boardRef.current)) {
      setCurrentPiece(newPiece)
    }
  }, [gameOver, isPaused, isValidMove])

  const rotate = useCallback(() => {
    const piece = currentPieceRef.current
    if (!piece || gameOver || isPaused) return
    const rotated = rotatePiece(piece)
    if (isValidMove(rotated, boardRef.current)) {
      setCurrentPiece(rotated)
    } else {
      const kicks = [1, -1, 2, -2]
      for (const kick of kicks) {
        const kicked = { ...rotated, x: rotated.x + kick }
        if (isValidMove(kicked, boardRef.current)) {
          setCurrentPiece(kicked)
          return
        }
      }
    }
  }, [gameOver, isPaused, rotatePiece, isValidMove])

  const hardDrop = useCallback(() => {
    const piece = currentPieceRef.current
    const boardState = boardRef.current
    if (!piece || gameOver || isPaused) return

    let dropY = piece.y
    while (isValidMove({ ...piece, y: dropY + 1 }, boardState)) {
      dropY++
    }

    const droppedPiece = { ...piece, y: dropY }
    lockPiece(droppedPiece, boardState)
  }, [gameOver, isPaused, isValidMove, lockPiece])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return
    const speed = Math.max(100, 1000 - (level - 1) * 100)
    const interval = setInterval(dropPiece, speed)
    return () => clearInterval(interval)
  }, [gameStarted, gameOver, isPaused, level, dropPiece])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          movePiece(-1)
          break
        case 'ArrowRight':
          e.preventDefault()
          movePiece(1)
          break
        case 'ArrowDown':
          e.preventDefault()
          dropPiece()
          break
        case 'ArrowUp':
          e.preventDefault()
          rotate()
          break
        case ' ':
          e.preventDefault()
          hardDrop()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, movePiece, dropPiece, rotate, hardDrop])

  const getGhostPosition = () => {
    if (!currentPiece) return null
    let ghostY = currentPiece.y
    while (isValidMove({ ...currentPiece, y: ghostY + 1 }, board)) {
      ghostY++
    }
    return ghostY
  }

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    const ghostY = getGhostPosition()
    const colors = ['transparent', '#06b6d4', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#3b82f6', '#f97316']

    return (
      <div className="relative">
        {displayBoard.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => {
              let isGhost = false
              let isCurrent = false
              let colorIndex = cell

              if (currentPiece) {
                const pieceY = y - currentPiece.y
                const pieceX = x - currentPiece.x
                if (pieceY >= 0 && pieceY < currentPiece.shape.length && pieceX >= 0 && pieceX < currentPiece.shape[pieceY].length) {
                  if (currentPiece.shape[pieceY][pieceX]) {
                    isCurrent = true
                    colorIndex = Object.keys(TETROMINOES).indexOf(currentPiece.type) + 1
                  }
                }
                if (ghostY !== null && ghostY !== currentPiece.y) {
                  const ghostPieceY = y - ghostY
                  const ghostPieceX = x - currentPiece.x
                  if (ghostPieceY >= 0 && ghostPieceY < currentPiece.shape.length && ghostPieceX >= 0 && ghostPieceX < currentPiece.shape[ghostPieceY].length) {
                    if (currentPiece.shape[ghostPieceY][ghostPieceX] && !isCurrent) {
                      isGhost = true
                      colorIndex = Object.keys(TETROMINOES).indexOf(currentPiece.type) + 1
                    }
                  }
                }
              }

              return (
                <div
                  key={x}
                  className="w-7 h-7 border border-white/5 relative"
                  style={{
                    backgroundColor: isCurrent || cell ? colors[colorIndex] : 'rgba(0,0,0,0.3)',
                    boxShadow: isCurrent ? `0 0 10px ${colors[colorIndex]}, inset 0 0 5px rgba(255,255,255,0.3)` :
                               cell ? `inset 0 0 5px rgba(255,255,255,0.2)` : 'none',
                    opacity: isGhost ? 0.3 : 1,
                  }}
                >
                  {(isCurrent || cell > 0) && (
                    <div className="absolute inset-0.5 rounded-sm bg-gradient-to-br from-white/30 to-transparent" />
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20" />
      </div>
    )
  }

  const renderNextPiece = () => {
    if (!nextPiece) return null
    const piece = TETROMINOES[nextPiece]
    return (
      <div className="flex flex-col items-center justify-center h-16">
        {piece.shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={x}
                className="w-5 h-5"
                style={{
                  backgroundColor: cell ? piece.color : 'transparent',
                  boxShadow: cell ? `0 0 8px ${piece.color}` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={gameRef} className="flex gap-6 outline-none" tabIndex={0}>
      {/* Game Board */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30" />
        <div className="relative bg-black/80 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
          {renderBoard()}
        </div>
      </div>

      {/* Side Panel */}
      <div className="flex flex-col gap-3 w-36">
        {/* Game Status Messages */}
        {gameOver && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg blur opacity-40 animate-pulse" />
            <div className="relative bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-red-500/30">
              <p className="text-center text-red-400 font-bold text-lg animate-pulse">游戏结束!</p>
              <p className="text-center text-gray-400 text-xs mt-1">得分: {score}</p>
            </div>
          </div>
        )}

        {isPaused && gameStarted && !gameOver && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg blur opacity-40 animate-pulse" />
            <div className="relative bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-yellow-500/30">
              <p className="text-center text-yellow-400 font-bold text-lg animate-pulse">已暂停</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {[
          { label: '分数', value: score, gradient: 'from-cyan-500 to-blue-500' },
          { label: '等级', value: level, gradient: 'from-purple-500 to-pink-500' },
          { label: '消行', value: lines, gradient: 'from-green-500 to-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-lg blur opacity-30 group-hover:opacity-50 transition`} />
            <div className="relative bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}

        {/* Next Piece */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg blur opacity-20" />
          <div className="relative bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">下一个</p>
            {renderNextPiece()}
          </div>
        </div>

        {/* Buttons */}
        {!gameStarted ? (
          <button
            onClick={startGame}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition" />
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-semibold text-sm transition transform hover:scale-105">
              {gameOver ? '再来一局' : '开始游戏'}
            </div>
          </button>
        ) : (
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition" />
            <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg font-semibold text-sm">
              {isPaused ? '继续' : '暂停'}
            </div>
          </button>
        )}

        {/* Controls */}
        <div className="relative mt-auto">
          <div className="bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">操作</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
              <span>← →</span><span>移动</span>
              <span>↑</span><span>旋转</span>
              <span>↓</span><span>下落</span>
              <span>空格</span><span>直落</span>
              <span>P</span><span>暂停</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
