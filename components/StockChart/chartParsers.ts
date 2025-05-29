// components/StockChart/chartParsers.ts

export interface Bar {
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: number;
  }
  
  export const parseBar = (raw: any): Bar => ({
    symbol: raw.S || raw.s,
    open: raw.o,
    high: raw.h,
    low: raw.l,
    close: raw.c,
    volume: raw.v,
    timestamp: new Date(raw.t).getTime(),
  });
  
  export const parseBars = (bars: any[]): Bar[] => {
    return bars.map((bar) => ({
      symbol: bar.S || bar.s,
      timestamp: new Date(bar.t).getTime(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  };
  