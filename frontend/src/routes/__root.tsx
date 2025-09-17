import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import React, { Suspense } from "react";
import { AccountContext, type Account } from "./account";

const makeAccountInfo = () => {
  let cache: Account | null = null;
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
  let promise: Promise<void> | null = fetchData();
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
        <Link className="navbar_button" to="/">
          <div className="stront">STRONT.</div>
        </Link>
        <div className="navbar_items">{children}</div>
      </div>
    </div>
  </div>
);

const Layout = ({ account }: { account: Account | null }) => (
  <AccountContext value={account}>
    <Navbar>
      {account ? (
        <>
          <Link className="navbar_button" to="/account">
            account
          </Link>
          <button
            className="navbar_true_button"
            onClick={async () => {
              await accountInfo.logout();
            }}
          >
            sign out
          </button>
        </>
      ) : (
        <>
          <Link className="navbar_button" to="/login">
            login
          </Link>
          <Link className="navbar_button" to="/sign-up">
            sign up
          </Link>
        </>
      )}
    </Navbar>
    <div id="pagebody_wrapper">
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
