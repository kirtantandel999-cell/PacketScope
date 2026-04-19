import React from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import { Route, Routes, useLocation } from "react-router-dom";

import { PacketProvider } from "./context/PacketContext.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PacketsPage from "./pages/PacketsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const titleMap = {
  "/": "Dashboard",
  "/packets": "Packets",
  "/analytics": "Analytics",
  "/settings": "Settings"
};

function AppShell() {
  const location = useLocation();
  const title = titleMap[location.pathname] || "PacketScope";

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Sidebar />
      <Topbar title={title} />
      <main className="ml-[240px] min-h-screen px-6 pb-8 pt-[84px]">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/packets" element={<PacketsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <PacketProvider>
      <AppShell />
    </PacketProvider>
  );
}
