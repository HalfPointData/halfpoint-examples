// The shape of /odds and /sample/odds. See https://docs.halfpoint.tech/endpoints/odds/

export interface Price {
  home: number;
  away: number;
  /** moneyline_3way (soccer) only */
  draw?: number;
  /** false: the last price we had, kept as a reference; there is no current consensus */
  recent: boolean;
  /** Risk plan: widen or pull your quotes now. Says nothing about the market itself. */
  stop?: boolean;
  /** Risk plan: the market is reopening after a stop; quote wider */
  widened?: boolean;
  /** Risk plan: roughly a 90% confidence interval, [low, high] */
  range?: { home?: [number, number]; away?: [number, number] };
  /** when this price was computed */
  at: string;
}

export interface OddsFixture {
  id: string;
  league: string;
  start: string;
  markets: Partial<Record<"moneyline" | "moneyline_3way", Price>> & Record<string, Price>;
}

export interface OddsAnswer {
  updated: string;
  league?: string;
  fixtures: OddsFixture[];
}
