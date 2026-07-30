import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SupportProvider } from "./context/SupportProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { ChartsPage } from "./pages/ChartsPage";
import { CmsPage } from "./pages/CmsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cms/*" element={<CmsPage />} />
        <Route
          element={
            <SupportProvider>
              <AppLayout />
            </SupportProvider>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="chart" element={<ChartsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
