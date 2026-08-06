export type ApiStatus = "001" | "SUCCESS" | string;

export interface GameRate {
  type: string;
  min: number | string;
  max: number | string;
  status?: number;
  id?: number | string;
}

export type RatesMarketId = "main" | "night" | "starline" | "jackpot";

export type MarketRatesMap = Record<RatesMarketId, GameRate[]>;

export interface MarketGame {
  game_id?: number | string;
  id?: number | string;
  game_name: string;
  resultData?: string;
  open_time?: string;
  close_time?: string;
  result_time?: string;
  play?: number;
}

export interface TimedGame {
  game_id?: number | string;
  id?: number | string;
  game_name?: string;
  result_time: string;
  play?: number;
  resultData?: string;
}

export interface AnkDetail {
  game_result?: string;
  session_id?: string;
}

export interface SupportInfo {
  support_number?: string;
  [key: string]: unknown;
}

export interface LiveResultItem {
  gameName: string;
  result: string;
  timestamp: number;
}

export interface LotteryLastResult {
  winning_numbers?: string | number[] | null;
  declared_at?: string | null;
}

export interface LotteryGame {
  id: number | string;
  name: string;
  description?: string | null;
  tagline?: string | null;
  badge_label?: string | null;
  ticket_price?: number | string;
  is_featured?: boolean | number;
  playable?: boolean;
  pot_estimate?: number | string | null;
  open_time_clock?: string | null;
  close_time_clock?: string | null;
  draw_time_clock?: string | null;
  last_result?: LotteryLastResult | null;
  session?: {
    status?: string;
    total_tickets_sold?: number;
  } | null;
}

export interface LotteryResultRow {
  game_name?: string;
  winning_numbers?: string | number[] | null;
  declared_at?: string | null;
  prize_pool_amount?: number | string | null;
  pool_number?: string | number | null;
}
