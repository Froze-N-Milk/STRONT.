import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import React, { Suspense } from "react";
import { AccountContext, type Account } from "./-account";

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

const Layout = ({ account }: { account: Account | null }) => (
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
              <Link to="/login">login</Link>
            </div>
            <div className="navbar_item">
              <Link to="/sign-up">sign up</Link>
            </div>
          </>
        )}
      </Navbar>
      <Outlet />
    </div>
    <TanStackRouterDevtools />
  </AccountContext>
);

export const Route = createRootRoute({
  component: () => (
    <Suspense fallback={<Layout account={null} />}>
      <Layout account={accountInfo.read()} />
    </Suspense>
  ),
});
