'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type Board = (string | null)[];

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<{ player: string; line: number[] } | null>(null);
  const [mode, setMode] = useState<'two-player' | 'vs-computer'>('two-player');

  // Check for winner
  const checkWinner = (newBoard: Board): { player: string; line: number[] } | null => {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return { player: newBoard[a]!, line };
      }
    }
    return null;
  };

  // Get available moves
  const getAvailableMoves = (board: Board): number[] => {
    return board.reduce<number[]>((acc, cell, index) => {
      if (cell === null) acc.push(index);
      return acc;
    }, []);
  };

  // Minimax algorithm (computer plays O, user X)
  const minimax = (board: Board, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(board);
    if (result) {
      if (result.player === 'X') return 10 - depth;
      if (result.player === 'O') return -10 + depth;
    }
    if (getAvailableMoves(board).length === 0) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (const move of getAvailableMoves(board)) {
        const newBoard = [...board];
        newBoard[move] = 'X';
        const score = minimax(newBoard, depth + 1, false);
        best = Math.max(best, score);
      }
      return best;
    } else {
      let best = Infinity;
      for (const move of getAvailableMoves(board)) {
        const newBoard = [...board];
        newBoard[move] = 'O';
        const score = minimax(newBoard, depth + 1, true);
        best = Math.min(best, score);
      }
      return best;
    }
  };

  const getComputerMove = (board: Board): number => {
    let bestScore = Infinity;
    let bestMove = -1;
    for (const move of getAvailableMoves(board)) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      const score = minimax(newBoard, 0, true);
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  };

  const makeMove = (index: number, player: 'X' | 'O'): void => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);

    const win = checkWinner(newBoard);
    if (win) {
      setWinner(win);
    } else if (getAvailableMoves(newBoard).length === 0) {
      setWinner({ player: 'draw', line: [] });
    } else {
      setIsXNext(player === 'X' ? false : true);
    }
  };

  const handleClick = (index: number) => {
    if (mode === 'two-player') {
      const player = isXNext ? 'X' : 'O';
      makeMove(index, player);
    } else {
      if (!isXNext || board[index]) return; // only X can move
      makeMove(index, 'X');
    }
  };

 
  useEffect(() => {
    if (mode === 'vs-computer' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const move = getComputerMove(board);
        if (move !== -1) {
          makeMove(move, 'O');
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, winner, mode]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const toggleMode = () => {
    setMode(prev => (prev === 'two-player' ? 'vs-computer' : 'two-player'));
    resetGame();
  };

  const getStatus = () => {
    if (winner) {
      if (winner.player === 'draw') return "It's a draw!";
      if (mode === 'vs-computer') {
        return winner.player === 'X' ? 'You win! 🎉' : 'Computer wins! 🤖';
      }
      return `${winner.player} wins!`;
    }
    if (mode === 'vs-computer') {
      return isXNext ? 'Your turn (X)' : 'Computer is thinking...';
    }
    return `${isXNext ? 'X' : 'O'}'s turn`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Tic‑Tac‑Toe</span>
      </div>

      <h1 className={styles.title}>Tic‑Tac‑Toe</h1>

      <div className={styles.card}>
        <div className={styles.controls}>
          <button
            className={`${styles.modeButton} ${mode === 'two-player' ? styles.active : ''}`}
            onClick={toggleMode}
          >
             Two Players
          </button>
          <button
            className={`${styles.modeButton} ${mode === 'vs-computer' ? styles.active : ''}`}
            onClick={toggleMode}
          >
             vs Computer
          </button>
        </div>

        <div className={styles.status}>{getStatus()}</div>

        <div className={styles.board}>
          {board.map((value, index) => {
            const isWinning = winner?.line?.includes(index);
            return (
              <div
                key={index}
                className={`${styles.cell} ${isWinning ? styles.winning : ''}`}
                onClick={() => handleClick(index)}
              >
                {value}
              </div>
            );
          })}
        </div>

        <button className={styles.resetButton} onClick={resetGame}>
          New Game
        </button>
      </div>
    </div>
  );
}