import { useState, useEffect, useRef, useCallback } from 'react';

export interface StockfishSearchInfo {
  depth: number;
  seldepth: number;
  scoreCp: number;
  mate: number | null;
  nodes: number;
  nps: number;
  timeMs: number;
  pv: string;
}

export interface StockfishMultiPvCandidate {
  rank: number;
  bestMove: string;
  scoreCp: number;
  pv: string;
}

export interface UseStockfishReturn {
  isReady: boolean;
  isSearching: boolean;
  searchInfo: StockfishSearchInfo;
  bestMove: string | null;
  ponderMove: string | null;
  multiPvCandidates: StockfishMultiPvCandidate[];
  rawLogs: string[];
  startSearch: (fen: string, movetimeMs?: number) => void;
  stopSearch: () => void;
  sendCommand: (cmd: string) => void;
}

export const useStockfish = (): UseStockfishReturn & {
  bestMoveRef: React.MutableRefObject<string | null>;
  searchInfoRef: React.MutableRefObject<StockfishSearchInfo>;
  multiPvCandidatesRef: React.MutableRefObject<StockfishMultiPvCandidate[]>;
} => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchInfo, setSearchInfo] = useState<StockfishSearchInfo>({
    depth: 0,
    seldepth: 0,
    scoreCp: 0,
    mate: null,
    nodes: 0,
    nps: 0,
    timeMs: 0,
    pv: ''
  });
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [ponderMove, setPonderMove] = useState<string | null>(null);
  const [multiPvCandidates, setMultiPvCandidates] = useState<StockfishMultiPvCandidate[]>([]);
  const [rawLogs, setRawLogs] = useState<string[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const bestMoveRef = useRef<string | null>(null);
  const searchInfoRef = useRef<StockfishSearchInfo>(searchInfo);
  const multiPvCandidatesRef = useRef<StockfishMultiPvCandidate[]>([]);
  const multiPvMapRef = useRef<Map<number, StockfishMultiPvCandidate>>(new Map());

  // Initialize Worker
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker('/stockfish-19-lite-single.js');
    } catch {
      try {
        worker = new Worker('/stockfish-19-asm.js');
      } catch (err) {
        console.error('Failed to initialize Stockfish worker', err);
      }
    }

    if (!worker) return;
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const line = typeof event.data === 'string' ? event.data : '';
      if (!line) return;

      // Keep last 100 log lines
      setRawLogs((prev) => {
        const next = [...prev, line];
        return next.length > 100 ? next.slice(-100) : next;
      });

      if (line === 'readyok' || line.includes('uciok')) {
        setIsReady(true);
      }

      // Parse search info lines
      // e.g. "info depth 14 seldepth 23 multipv 1 score cp 32 nodes 47992 nps 277410 time 173 pv e7e5 ..."
      if (line.startsWith('info ') && line.includes('depth ')) {
        const depthMatch = line.match(/\bdepth (\d+)/);
        const seldepthMatch = line.match(/\bseldepth (\d+)/);
        const scoreCpMatch = line.match(/\bscore cp (-?\d+)/);
        const mateMatch = line.match(/\bscore mate (-?\d+)/);
        const nodesMatch = line.match(/\bnodes (\d+)/);
        const npsMatch = line.match(/\bnps (\d+)/);
        const timeMatch = line.match(/\btime (\d+)/);
        const pvMatch = line.match(/\bpv (.+)$/);
        const multiPvMatch = line.match(/\bmultipv (\d+)/);

        const rank = multiPvMatch ? parseInt(multiPvMatch[1], 10) : 1;
        const pvText = pvMatch ? pvMatch[1].trim() : '';
        const firstMove = pvText ? pvText.split(' ')[0] : '';

        if (firstMove) {
          multiPvMapRef.current.set(rank, {
            rank,
            bestMove: firstMove,
            scoreCp: scoreCpMatch ? parseInt(scoreCpMatch[1], 10) : 0,
            pv: pvText
          });
          const cands = Array.from(multiPvMapRef.current.values()).sort((a, b) => a.rank - b.rank);
          multiPvCandidatesRef.current = cands;
          setMultiPvCandidates(cands);
        }

        if (rank === 1) {
          const infoUpdate = {
            depth: depthMatch ? parseInt(depthMatch[1], 10) : searchInfoRef.current.depth,
            seldepth: seldepthMatch ? parseInt(seldepthMatch[1], 10) : searchInfoRef.current.seldepth,
            scoreCp: scoreCpMatch ? parseInt(scoreCpMatch[1], 10) : searchInfoRef.current.scoreCp,
            mate: mateMatch ? parseInt(mateMatch[1], 10) : (scoreCpMatch ? null : searchInfoRef.current.mate),
            nodes: nodesMatch ? parseInt(nodesMatch[1], 10) : searchInfoRef.current.nodes,
            nps: npsMatch ? parseInt(npsMatch[1], 10) : searchInfoRef.current.nps,
            timeMs: timeMatch ? parseInt(timeMatch[1], 10) : searchInfoRef.current.timeMs,
            pv: pvMatch ? pvMatch[1].trim() : searchInfoRef.current.pv
          };
          searchInfoRef.current = infoUpdate;
          setSearchInfo(infoUpdate);
        }
      }

      // Parse bestmove line: "bestmove e7e5 ponder g1f3"
      if (line.startsWith('bestmove ')) {
        const parts = line.split(' ');
        const move = parts[1] || null;
        const ponder = parts[2] === 'ponder' ? parts[3] : null;

        bestMoveRef.current = move;
        setBestMove(move);
        setPonderMove(ponder);
        setIsSearching(false);
      }
    };

    // Initialize engine with MultiPV 3 for Tactical-Positional Blending
    worker.postMessage('uci');
    worker.postMessage('setoption name Hash value 64');
    worker.postMessage('setoption name MultiPV value 3');
    worker.postMessage('isready');

    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  const startSearch = useCallback((fen: string, movetimeMs: number = 5000) => {
    if (!workerRef.current) return;
    bestMoveRef.current = null;
    setBestMove(null);
    setPonderMove(null);
    multiPvMapRef.current.clear();
    multiPvCandidatesRef.current = [];
    setMultiPvCandidates([]);
    setIsSearching(true);
    const blankInfo = {
      depth: 0,
      seldepth: 0,
      scoreCp: 0,
      mate: null,
      nodes: 0,
      nps: 0,
      timeMs: 0,
      pv: ''
    };
    searchInfoRef.current = blankInfo;
    setSearchInfo(blankInfo);

    workerRef.current.postMessage('stop');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go movetime ${movetimeMs}`);
  }, []);

  const stopSearch = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage('stop');
    setIsSearching(false);
  }, []);

  const sendCommand = useCallback((cmd: string) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage(cmd);
  }, []);

  return {
    isReady,
    isSearching,
    searchInfo,
    bestMove,
    ponderMove,
    multiPvCandidates,
    rawLogs,
    startSearch,
    stopSearch,
    sendCommand,
    bestMoveRef,
    searchInfoRef,
    multiPvCandidatesRef
  };
};
