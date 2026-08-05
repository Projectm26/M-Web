import { useEffect } from "react";
import { LiveTicker } from "../components/home/LiveTicker";
import { Hero } from "../components/home/Hero";
import { RatesGrid } from "../components/home/RatesGrid";
import { LiveMarkets } from "../components/home/LiveMarkets";
import { NightMarketSection } from "../components/home/NightMarketSection";
import { LotterySection } from "../components/home/LotterySection";
import { DownloadBand } from "../components/home/DownloadBand";
import { Faq } from "../components/home/Faq";
import { useHomeData } from "../hooks/useHomeData";
import { useSupport } from "../context/useSupport";
import "./HomePage.css";

export function HomePage() {
  const data = useHomeData();
  const { setSupportNumber } = useSupport();

  useEffect(() => {
    if (data.supportNumber) setSupportNumber(data.supportNumber);
  }, [data.supportNumber, setSupportNumber]);

  return (
    <>
      <LiveTicker items={data.liveResults} />
      <Hero supportNumber={data.supportNumber} />

      {data.error ? (
        <div className="container home-error-wrap">
          <div className="state-block error" role="alert">
            <p>Couldn’t load live data. {data.error}</p>
            <button type="button" className="btn btn-primary" onClick={data.refresh}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <LiveMarkets
        mainGames={data.mainGames}
        starlineGames={data.starlineGames}
        jackpotGames={data.jackpotGames}
        jackpotSummary={data.jackpotSummary}
        starlineSummary={data.starlineSummary}
        loading={data.marketsLoading}
      />
      <NightMarketSection games={data.nightGames} loading={data.loading && !data.nightGames.length} />
      <LotterySection
        games={data.lotteryGames}
        results={data.lotteryResults}
        loading={data.loading && !data.lotteryGames.length}
      />
      <RatesGrid rates={data.rates} loading={data.loading && !data.rates.length} />
      <DownloadBand />
      <Faq />
    </>
  );
}
