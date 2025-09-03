import { createFileRoute } from "@tanstack/react-router";
import { AccountContext } from "../__root";
import { use } from "react";

function Account() {
	const account = use(AccountContext)!
	return <div>
		Hello {account.email}!
	</div>
}

export const Route = createFileRoute('/account/')({
	component: Account,
})
