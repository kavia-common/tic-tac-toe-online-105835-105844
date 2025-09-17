import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional Theme tokens for inline usage by components.
 * We still keep CSS variables in App.css for base, but enrich here for the app UI.
 */
const THEME = {
  name: 'Ocean Professional',
  primary: '#2563EB', // blue-600
  secondary: '#F59E0B', // amber-500
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(249,250,251,1) 100%)',
};

/**
 * Utility functions
 */
const LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diags
  [2, 4, 6],
];

/**
 * Check winner and return { winner: 'X'|'O'|null, line: number[]|null, isDraw: boolean }
 */
function evaluateBoard(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c], isDraw: false };
    }
  }
  const isDraw = squares.every(Boolean);
  return { winner: null, line: null, isDraw };
}

/**
 * Simple AI:
 * 1) Take win if available.
 * 2) Block opponent's win.
 * 3) Take center if free.
 * 4) Take a corner if free.
 * 5) Take any side.
 */
function getAiMove(squares, ai, human) {
  // Try winning move
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const copy = squares.slice();
      copy[i] = ai;
      if (evaluateBoard(copy).winner === ai) return i;
    }
  }
  // Block human win
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const copy = squares.slice();
      copy[i] = human;
      if (evaluateBoard(copy).winner === human) return i;
    }
  }
  // Center
  if (!squares[4]) return 4;
  // Corners
  const corners = [0, 2, 6, 8].filter(i => !squares[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Sides
  const sides = [1, 3, 5, 7].filter(i => !squares[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return null;
}

/**
 * Square Component
 */
function Square({ value, onClick, highlight, index }) {
  return (
    <button
      className="ttt-square"
      aria-label={`Square ${index + 1}, ${value ? value : 'empty'}`}
      onClick={onClick}
      disabled={Boolean(value)}
      data-highlight={highlight ? 'true' : 'false'}
    >
      {value}
    </button>
  );
}

/**
 * Scoreboard Component
 */
function Scoreboard({ scores, currentPlayer, mode }) {
  return (
    <div className="ttt-scoreboard" role="status" aria-live="polite">
      <div className="score-card" data-active={currentPlayer === 'X'}>
        <div className="label">Player X</div>
        <div className="score">{scores.X}</div>
      </div>
      <div className="score-card" data-active={currentPlayer === 'O' && mode === 'PVP'}>
        <div className="label">{mode === 'AI' ? 'Computer (O)' : 'Player O'}</div>
        <div className="score">{scores.O}</div>
      </div>
      <div className="score-card neutral">
        <div className="label">Draws</div>
        <div className="score">{scores.D}</div>
      </div>
    </div>
  );
}

/**
 * Controls Component
 */
function Controls({
  mode,
  setMode,
  onRestartRound,
  onResetScore,
  canUndo,
  onUndo,
  isBoardActive,
}) {
  return (
    <div className="ttt-controls">
      <div className="mode-switch">
        <label className="switch-label">Mode</label>
        <div className="switch-group" role="tablist" aria-label="Game mode">
          <button
            role="tab"
            aria-selected={mode === 'PVP'}
            className={`switch ${mode === 'PVP' ? 'active' : ''}`}
            onClick={() => setMode('PVP')}
          >
            Two Players
          </button>
          <button
            role="tab"
            aria-selected={mode === 'AI'}
            className={`switch ${mode === 'AI' ? 'active' : ''}`}
            onClick={() => setMode('AI')}
          >
            Vs Computer
          </button>
        </div>
      </div>
      <div className="action-group">
        <button className="btn primary" onClick={onRestartRound} aria-label="Restart round">
          Restart
        </button>
        <button className="btn ghost" onClick={onResetScore} aria-label="Reset score">
          Reset Score
        </button>
        <button
          className="btn ghost"
          onClick={onUndo}
          disabled={!canUndo || !isBoardActive}
          aria-disabled={!canUndo || !isBoardActive}
          aria-label="Undo last move"
          title="Undo last move"
        >
          Undo
        </button>
      </div>
    </div>
  );
}

/**
 * Board Component
 */
function Board({ squares, onPlay, highlightLine, disabled }) {
  return (
    <div
      className="ttt-board"
      role="grid"
      aria-label="Tic Tac Toe board"
      aria-disabled={disabled ? 'true' : 'false'}
    >
      {squares.map((sq, i) => (
        <Square
          key={i}
          index={i}
          value={sq}
          onClick={() => onPlay(i)}
          highlight={highlightLine?.includes(i)}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Theme handling - stick with light modern Ocean Professional visuals.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const [mode, setMode] = useState('AI'); // 'AI' or 'PVP'
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 });
  const [statusMsg, setStatusMsg] = useState('');
  const current = history[history.length - 1];

  const evaluation = useMemo(() => evaluateBoard(current), [current]);
  const gameOver = Boolean(evaluation.winner) || evaluation.isDraw;

  useEffect(() => {
    if (evaluation.winner) {
      setStatusMsg(`${evaluation.winner} wins this round!`);
      setScores(s => ({ ...s, [evaluation.winner]: s[evaluation.winner] + 1 }));
    } else if (evaluation.isDraw) {
      setStatusMsg(`It's a draw.`);
      setScores(s => ({ ...s, D: s.D + 1 }));
    } else {
      setStatusMsg(`${xIsNext ? 'X' : 'O'} to move`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation.winner, evaluation.isDraw]);

  // AI move
  useEffect(() => {
    if (!gameOver && mode === 'AI' && !xIsNext) {
      const timer = setTimeout(() => {
        const move = getAiMove(current, 'O', 'X');
        if (move !== null) {
          handlePlay(move);
        }
      }, 400); // small delay for UX
      return () => clearTimeout(timer);
    }
  }, [gameOver, mode, xIsNext, current]);

  function nextPlayerSymbol() {
    return xIsNext ? 'X' : 'O';
  }

  // PUBLIC_INTERFACE
  function handlePlay(index) {
    /**
     * Handle a player's move. Enforces valid moves and updates state.
     */
    if (gameOver) return;
    if (current[index]) return;
    if (mode === 'AI' && !xIsNext) return; // lock human when AI turn

    const next = current.slice();
    next[index] = nextPlayerSymbol();

    setHistory(h => [...h, next]);
    setXIsNext(prev => !prev);
  }

  // PUBLIC_INTERFACE
  function restartRound() {
    /**
     * Restart only the current round, keep scores.
     */
    setHistory([Array(9).fill(null)]);
    setXIsNext(true);
    setStatusMsg('X to move');
  }

  // PUBLIC_INTERFACE
  function resetScore() {
    /**
     * Reset scoreboard and round.
     */
    setScores({ X: 0, O: 0, D: 0 });
    restartRound();
  }

  // PUBLIC_INTERFACE
  function undoMove() {
    /**
     * Undo the last move (only within current round).
     */
    if (history.length <= 1 || gameOver) return;
    setHistory(h => h.slice(0, -1));
    setXIsNext(prev => !prev);
  }

  // PUBLIC_INTERFACE
  function changeMode(nextMode) {
    /**
     * Change between PvP and Vs AI; resets the round for clarity.
     */
    setMode(nextMode);
    restartRound();
  }

  return (
    <div
      className="ttt-app"
      style={{
        minHeight: '100vh',
        background: THEME.gradient,
        color: THEME.text,
      }}
    >
      <main className="ttt-container" role="main" aria-labelledby="app-title">
        <header className="ttt-header">
          <h1 id="app-title" className="title">
            Tic Tac Toe
          </h1>
          <p className="subtitle">Ocean Professional</p>
        </header>

        <Scoreboard scores={scores} currentPlayer={xIsNext ? 'X' : 'O'} mode={mode} />

        <section className="ttt-stage">
          <div className="status-banner" role="status" aria-live="polite">
            {statusMsg}
          </div>

          <Board
            squares={current}
            onPlay={handlePlay}
            highlightLine={evaluation.line}
            disabled={gameOver || (mode === 'AI' && !xIsNext)}
          />

          <Controls
            mode={mode}
            setMode={changeMode}
            onRestartRound={restartRound}
            onResetScore={resetScore}
            canUndo={history.length > 1}
            onUndo={undoMove}
            isBoardActive={!gameOver}
          />
        </section>

        <footer className="ttt-footer">
          <div className="legend">
            <span className="badge x">X</span> <span>goes first</span>
            <span className="dot" />
            <span className="badge o">O</span> <span>{mode === 'AI' ? 'Computer' : 'Second Player'}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
