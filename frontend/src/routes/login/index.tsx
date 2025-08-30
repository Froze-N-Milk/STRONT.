import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const loginRequest = (email: string, password: string) =>
	fetch("/api/login", {
		method: "POST",
		body: JSON.stringify({
			email,
			password,
		})
	})


function Login() {
	// TODO: add login page
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	return <div style={{
		display: "flex",
		flexDirection: "column",
		gap: 10,
	}}>
		<input type="email" onChange={e => setEmail(e.currentTarget.value)} placeholder="email" />
		<input type="password" onChange={e => setPassword(e.currentTarget.value)} placeholder="password" />
		<button
			onClick={async () => await loginRequest(email, password)}>
			Login
		</button>
	</div>
}

export const Route = createFileRoute('/login/')({
	component: Login,
})
