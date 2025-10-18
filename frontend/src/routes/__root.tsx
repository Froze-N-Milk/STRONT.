import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import React, { Suspense } from "react";
import { AccountContext, type Account } from "./-account";
import { LoginModal } from "./login/index";
import { SignUpModal } from "./sign-up/index";

const makeAccountInfo = () => {
  let cache: Account | null = null;
  let promise: Promise<void> | null = null;
  const fetchData = () =>
    fetch("/api/account/name", {
      method: "GET",
    }).then(async (r) => {
      promise = null;
      if (r.status == 200) {
        cache = {
          email: await r.text(),
        };
      } else {
        cache = null;
      }
    });
  promise = fetchData();
  return {
    read() {
      if (promise) throw promise;
      return cache;
    },
    async logout() {
      cache = null;
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    },
  };
};

const accountInfo = makeAccountInfo();

const Navbar = ({ children }: { children?: React.ReactNode }) => (
  <div id="pagecontent_container">
    <div className="navbar_wrapper">
      <div id="navbar_container">
        <div className="stront">
          <Link to="/">STRONT.</Link>
        </div>
        <div className="navbar_items_container">{children}</div>
        <div className="navbar_toggle_button">empty</div>
      </div>
    </div>
  </div>
);

const Layout = ({ account }: { account: Account | null }) => {
  const navigate = useNavigate();
  const location = useRouterState({
    select: (state) => state.location,
  });
  const search = location.search as Record<string, unknown> | undefined;
  const authValue = typeof search?.auth === "string" ? search.auth : null;
  const showLogin = authValue === "login";
  const showSignUp = authValue === "signup";

  const openAuthModal = React.useCallback(
    (type: "login" | "signup") => {
      navigate({
        to: ".",
        search: (prev) => ({
          ...(prev as Record<string, unknown>),
          auth: type,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  const closeAuthModal = React.useCallback(() => {
    navigate({
      to: ".",
      search: (prev) => {
        const next = { ...(prev as Record<string, unknown>) };
        delete next.auth;
        return next;
      },
      replace: true,
    });
  }, [navigate]);

  return (
    <AccountContext value={account}>
      <div id="pagebody_wrapper">
        <Navbar>
          {account ? (
            <>
              <div className="navbar_item">
                <Link to="/account">
                  <button>account</button>
                </Link>
              </div>
              <div className="navbar_item">
                <button
                  onClick={async () => {
                    await accountInfo.logout();
                  }}
                >
                  sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="navbar_item">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                    textDecoration: "underline",
                    font: "inherit",
                  }}
                >
                  login
                </button>
              </div>
              <div className="navbar_item">
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                    textDecoration: "underline",
                    font: "inherit",
                  }}
                >
                  sign up
                </button>
              </div>
            </>
          )}
        </Navbar>
        <Outlet />
        {showLogin && (
          <LoginModal
            onClose={closeAuthModal}
            onSwitchToSignUp={() => openAuthModal("signup")}
          />
        )}
        {showSignUp && (
          <SignUpModal
            onClose={closeAuthModal}
            onSwitchToLogin={() => openAuthModal("login")}
          />
        )}
      </div>
      <TanStackRouterDevtools />
    </AccountContext>
  );
};

export const Route = createRootRoute({
  component: () => (
    <Suspense fallback={<Layout account={null} />}>
      <Layout account={accountInfo.read()} />
    </Suspense>
  ),
});
