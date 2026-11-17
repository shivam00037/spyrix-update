import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Home,
  Menu,
  Palette,
  Search,
  LogOut,
  UserRound,
  Check,
} from "lucide-react";

import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import { useData } from "../data/DataContext";
import { SPYRIX_THEMES } from "../themeConfig";

export default function Topbar({ onOpenMenu, theme, onThemeChange }) {
  const [query, setQuery] = useState("");
  const searchInput = useRef(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState("");

  const { user, business, logout } = useAuth();
  const { records } = useData();
  const navigate = useNavigate();

  const notificationCount =
    (records?.invoices || []).filter((row) => row.status === "overdue").length +
    (records?.products || []).filter(
      (row) => row.lowStockAt > 0 && row.stockOnHand <= row.lowStockAt,
    ).length;

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };

    window.addEventListener("keydown", onShortcut);

    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const search = async (event) => {
    event.preventDefault();

    const term = query.trim();

    if (!term) {
      setResults(null);
      setError("");
      return;
    }

    try {
      setError("");

      const data = await apiRequest(`/search?q=${encodeURIComponent(term)}`);

      setResults(data.results || []);
      setOpen("search");
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
      setResults([]);
      setOpen("search");
    }
  };

  const changeTheme = (themeId) => {
    if (typeof onThemeChange === "function") {
      onThemeChange(themeId);
    }

    setOpen("");
  };

  const closePopover = () => setOpen("");

  return (
    <header className="topbar">
      <button
        className="mobile-menu-button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        type="button"
      >
        <Menu size={22} />
      </button>

      <div className="topbar-search-wrap">
        <form className="topbar-search" onSubmit={search}>
          <Search size={21} strokeWidth={2.4} />

          <input
            ref={searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (results !== null) setOpen("search");
            }}
            placeholder="Search customers, invoices, products..."
            aria-label="Search records"
          />

          <kbd>Ctrl + K</kbd>
        </form>

        {open === "search" && (
          <div className="topbar-popover search-results">
            <div className="popover-title">
              Search results
              <button
                type="button"
                onClick={closePopover}
                aria-label="Close search results"
              >
                ×
              </button>
            </div>

            {error ? (
              <p className="popover-empty">{error}</p>
            ) : results?.length ? (
              results.map((item) => (
                <button
                  type="button"
                  key={`${item.type}-${item.id}`}
                  className="search-result"
                  onClick={() => {
                    navigate(item.path || "/app/dashboard");
                    closePopover();
                  }}
                >
                  <span className="result-type">{item.type}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className="popover-empty">No matching records found.</p>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button
          className="top-icon home-top-icon"
          aria-label="Dashboard"
          type="button"
          onClick={() => navigate("/app/dashboard")}
        >
          <Home size={20} />
        </button>

        {/* Theme selector */}
        <div className="popover-anchor">
          <button
            className="top-icon"
            aria-label="Change theme"
            type="button"
            aria-expanded={open === "theme"}
            onClick={() => setOpen(open === "theme" ? "" : "theme")}
          >
            <Palette size={20} />
          </button>

          {open === "theme" && (
            <div className="topbar-popover theme-popover">
              <strong className="theme-popover-title">Choose theme</strong>

              {SPYRIX_THEMES.map((option) => {
                const selected = theme === option.id;

                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`theme-option ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => changeTheme(option.id)}
                  >
                    <span
                      className="theme-dot"
                      style={{
                        backgroundColor: option.accent,
                        borderColor: option.darkAccent,
                      }}
                      aria-hidden="true"
                    />

                    <span className="theme-option-name">
                      {option.name || option.label || option.id}
                    </span>

                    {selected && (
                      <Check className="theme-option-check" size={17} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="popover-anchor">
          <button
            className="top-icon notification-top-icon"
            aria-label="Notifications"
            type="button"
            aria-expanded={open === "notifications"}
            onClick={() =>
              setOpen(open === "notifications" ? "" : "notifications")
            }
          >
            <Bell size={20} />

            {notificationCount > 0 && (
              <i>{notificationCount > 9 ? "9+" : notificationCount}</i>
            )}
          </button>

          {open === "notifications" && (
            <div className="topbar-popover notification-popover">
              <strong>Notifications</strong>

              <p className="popover-empty">
                {notificationCount
                  ? `${notificationCount} business alert${
                      notificationCount === 1 ? "" : "s"
                    } need attention: overdue invoices or low-stock products.`
                  : "You are all caught up. There are no overdue invoices or low-stock alerts."}
              </p>

              <button
                type="button"
                className="popover-link"
                onClick={() => {
                  navigate("/app/notifications");
                  closePopover();
                }}
              >
                Open notifications
              </button>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="popover-anchor profile-anchor">
          <button
            className="profile-button"
            type="button"
            aria-expanded={open === "profile"}
            onClick={() => setOpen(open === "profile" ? "" : "profile")}
          >
            <span className="profile-avatar">
              {(user?.name || "SP")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>

            <span className="profile-copy">
              <strong>{user?.name || "Business Owner"}</strong>
              <small>{business?.name || "Workspace"}</small>
            </span>

            <ChevronDown size={17} />
          </button>

          {open === "profile" && (
            <div className="topbar-popover profile-popover">
              <div className="profile-popover-user">
                <UserRound size={18} />

                <span>
                  <strong>{user?.email || "Account"}</strong>
                  <small>{business?.name || "Workspace"}</small>
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  closePopover();
                  logout();
                  navigate("/");
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
