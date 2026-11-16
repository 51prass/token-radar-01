# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/51prass/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/51prass/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Build the best token launch radar. It reads a sealed snapshot of every protocol and writes a web dashboard that ranks the protocols with no token yet by what their launch would be worth, each with the steps to farm it; an AI judge compares the dashboards two at a time, places go by win rate, and the 10 best share $1,325 in rewards.

## The model

Implied value = TVL × size × category × growth × maturity × breadth, from the snapshot's own figures only: the TVL multiple slides from 0.32 at $50M to 0.18 at $2B, the category sets revenue quality (exchanges and lending 1.10–1.15, bridges 0.72), growth is the clamped 7-day TVL change, maturity is a flattening age curve, and breadth adds 0.04 per extra chain. The board covers all 40 watchlist protocols plus the 160 strongest pre-token protocols below the floor, picked by implied value. Live-token protocols sit apart with the market's own caps. See `lib/model.ts` for the formula in full.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
