import { createFileRoute } from "@tanstack/react-router";

type Account = {
	email: string,
}

// WARNING: this does not currently work, as the backend endpoint has not been
// added
//const accountInfo = (): Promise<Account> =>
//	fetch("/api/account", {
//		method: "GET",
//	}).then(async r => r.json())

async function Account() {
	// see above warning
	// const account = await accountInfo();
	const account = {
		email: "admin@example.com"
	}

	return <div>
		Hello {account.email}!
	</div>
}

export const Route = createFileRoute('/account/')({
	component: Account,
})
