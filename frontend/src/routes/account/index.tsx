import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const accountInfo = (): Promise<string> =>
	fetch("/api/account", {
		method: "GET",
	}).then(async r => r.text())

async function Account() {
	const [email, setEmail] = useState("")
	useEffect(() => {
		accountInfo()
			.then(setEmail)
	}, [])

	return <div>
		Hello {email}!
	</div>
}

export const Route = createFileRoute('/account/')({
	component: Account,
})
