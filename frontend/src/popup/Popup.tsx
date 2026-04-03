import { MemoryRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "../pages/Home";
import AddSnippet from "../pages/AddSnippet";
import Settings from "../pages/Settings";
import History from "../pages/History";

export default function Popup() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <div className="w-80 h-[520px] flex flex-col bg-white overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddSnippet />} />
          <Route path="/edit/:id" element={<AddSnippet />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
        </Routes>
        <BottomNav />
      </div>
    </MemoryRouter>
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav on add/edit pages — full-screen form
  const hideOn = ["/add", "/edit"];
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null;

  const tabs = [
    {
      path: "/",
      label: "Snippets",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2.75A.75.75 0 012.75 2h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 2.75zm0 5A.75.75 0 012.75 7h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 7.75zM2.75 12a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z"/>
        </svg>
      ),
    },
    {
      path: "/history",
      label: "History",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"/>
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "Settings",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.429 1.525a6.593 6.593 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.205.065.15.24.287.492.41.752.124.26.227.531.308.807.032.107-.004.188-.087.228l-.99.5c-.5.254-.836.705-.954 1.189-.029.12-.064.239-.104.357-.144.422-.091.895.197 1.286l.642.866c.068.091.063.171.027.228a6.588 6.588 0 01-.808.808c-.057.036-.137.041-.228-.027l-.866-.642c-.39-.288-.863-.34-1.286-.196-.118.04-.237.075-.357.104-.484.118-.935.454-1.189.953l-.5.99c-.04.084-.12.12-.228.088a6.584 6.584 0 01-.752-.308 6.586 6.586 0 01-.752-.41c-.049-.03-.095-.095-.065-.205l.303-1.102c.153-.56.008-1.113-.27-1.53a4.587 4.587 0 01-.29-.501c-.222-.447-.629-.85-1.189-.997L2.144 9.14c-.11-.029-.176-.091-.146-.137a6.59 6.59 0 010-1.142c.03-.046.035-.108.146-.137l1.105-.289c.56-.147.967-.55 1.189-.997.086-.174.183-.341.29-.501.278-.417.423-.97.27-1.53L4.695 3.306c-.03-.11.016-.175.065-.205.24-.15.492-.287.752-.41.26-.124.531-.227.807-.308.107-.032.188.004.228.087l.5.99c.254.5.705.836 1.189.954.12.029.239.064.357.104.422.144.895.091 1.286-.197l.866-.642c.091-.068.171-.063.228-.027zM8 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="flex border-t border-gray-100 bg-white">
      {tabs.map((tab) => {
        const active =
          tab.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              active
                ? "text-violet-600 font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className={active ? "text-violet-600" : "text-gray-400"}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}