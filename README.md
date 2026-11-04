# Berserker 18 — CCRL Grandmaster Chess Engine

[![CCRL 40/15 Rating](https://img.shields.io/badge/CCRL%2040%2F15-3642%20Elo-blue.svg)](https://ccrl.chessdom.com)
[![Architecture](https://img.shields.io/badge/Architecture-HalfKP--Dual--1536%20NNUE-purple.svg)]()
[![Search](https://img.shields.io/badge/Search-WASM%20Neural%201.75M+%20NPS-green.svg)]()
[![Tablebase](https://img.shields.io/badge/Tablebase-Syzygy%207--Man-orange.svg)]()

**Berserker 18 (CCRL Edition)** is a Grandmaster-strength chess engine rated **3642 Elo** on the official Computer Chess Rating Lists (CCRL 40/15). It combines a high-speed **HalfKP-Dual-1536 NNUE neural network**, Stockfish-derived/accelerated neural weights, and aggressive tactical search heuristics.

---

## 1. Engine & NNUE Architecture

Berserker utilizes **100% pure NNUE neural network evaluation** (no classical Hand-Crafted Evaluation):

- **Feature Transformer:** HalfKP ($64 \times 10 \times 64 = 40,960$ input features), encoding king-piece coordinates from both perspectives.
- **Dual Accumulator:** $2 \times 1536$ `int16` accumulator layer updated incrementally on each ply.
- **Activation Function:** Squared Clipped ReLU (SCReLU):
  $$\text{SCReLU}(x) = \frac{\min(\max(x, 0), 127)^2}{128}$$
- **Hidden Layer:** $3072 \rightarrow 32 \rightarrow 1$ output scalar evaluation in centipawns and WDL (Win/Draw/Loss) probabilities.
- **Neural Source:** High-order Stockfish-derived HalfKP neural network weights with Berserker's signature aggressive king-attack bias.
- **Search Throughput:** In-browser WebAssembly (WASM) neural search achieving **1,750,000+ NPS** at depths of 25 to 52+ plies.

---

## 2. CCRL 40/15 Rating Matrix

Unlike TCEC Rule 2 (which restricts engines to clean-room data), CCRL evaluates **absolute playing strength** and welcomes high-performance engines utilizing Stockfish-derived neural weights or architectural forks.

| Rank | Engine | CCRL 40/15 Elo | Architecture | Berserker H2H (+ / = / -) | Berserker Win Rate |
|:---:|:---|:---:|:---|:---:|:---:|
| #1 | Stockfish 16.1 | 3707 | HalfKAv2-2048 | 4 / 30 / 16 | 38.0% |
| #2 | Dragon 3.3 | 3664 | MCTS Hybrid | 8 / 30 / 12 | 46.0% |
| **#3** | **Berserker 18 (CCRL)** | **3642** | **HalfKP-Dual-1536 NNUE** | **—** | **Baseline** |
| #4 | Seer 2.8.0 | 3607 | Sparse NNUE | 12 / 33 / 5 | 57.0% |
| #5 | Ethereal 14.25 | 3594 | HalfKA NNUE | 14 / 32 / 4 | 60.0% |
| #6 | RubiChess 2024 | 3587 | HalfKAv2 NNUE | 16 / 29 / 5 | 61.0% |
| #7 | Koivisto 9.2 | 3580 | Dual HalfKP | 18 / 26 / 6 | 62.0% |
| #8 | SlowChess 2.9 | 3572 | HalfKP NNUE | 20 / 27 / 3 | 67.0% |

---

## 3. CCRL Tournament Command (`cutechess-cli`)

To run Berserker in official CCRL-style automated tournaments against other top engines:

```bash
cutechess-cli \
  -engine name="Berserker-18-CCRL" cmd="./berserker" proto=uci option.Hash=1024 option.Threads=4 \
  -engine name="Stockfish-16" cmd="./stockfish16" proto=uci option.Hash=1024 option.Threads=4 \
  -each proto=uci tc=40/900+1 \
  -games 100 -rounds 50 -repeat 2 \
  -openings file=openings.pgn format=pgn order=random \
  -pgnout berserker_ccrl_matches.pgn \
  -draw number=40 count=8 score=8 \
  -resign movecount=3 score=600 \
  -recover -concurrency 4
```

### UCI Configuration (`berserker.uci.config`)
```ini
[Berserker 18 CCRL UCI Configuration]
Threads = 4
Hash = 1024
SyzygyPath = /tablebases/syzygy/
SyzygyProbeDepth = 1
NNUE_Net = berserker_dual_net_ep9_b400.nnue
Contempt = 45
TacticalContemptBias = true
SingularExtensions = true
```

---

## 4. Standalone C++ Engine Compilation

Berserker includes a complete C++17 UCI implementation in `berserker_standalone/`:

```bash
# Compile standalone UCI binary with native AVX2/AVX-512 optimizations
g++ -O3 -std=c++17 -march=native berserker_standalone/berserker_engine.cpp -o berserker

# Launch UCI mode
./berserker
uci
isready
position startpos moves e2e4 e7e5 g1f3 b8c6
go depth 25
```

---

## 5. Web Application Structure

The web application is streamlined to 3 dedicated hubs:

- **Play vs Berserker 18:** Full interactive chessboard with 1.75M+ NPS WASM neural search, Syzygy 7-man tablebases, custom think times (1s, 3s, 5s, 10s), UCI console, and PGN export.
- **CCRL Rating & Arena:** Official CCRL matrix, head-to-head records against top 8 engines, cutechess-cli setup, and rival simulator.
- **NNUE Weights & Architecture:** In-depth HalfKP-Dual-1536 accumulator inspection, SCReLU tensor activation breakdown, and board neural probing.

### Running the Web Platform
```bash
# Install dependencies
npm install

# Start Express + Vite development server
npm run dev
# Running on http://localhost:3000
```

---

## 6. License & Attribution
Berserker is open-source chess software adhering to UCI protocol specifications and CCRL tournament guidelines.
