import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DownloadFab } from "./DownloadFab";
import { useSupport } from "../../context/useSupport";
import { useFestivalSkin } from "../../hooks/useFestivalSkin";

export function AppLayout() {
  const { supportNumber } = useSupport();
  useFestivalSkin();

  return (
    <div className="app-shell">
      <Header supportNumber={supportNumber} />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer supportNumber={supportNumber} />
      <DownloadFab />
    </div>
  );
}
