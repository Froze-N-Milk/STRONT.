import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const loginRequest = (email: string, password: string) =>
	fetch("/api/login", {
		method: "POST",
		body: JSON.stringify({
			email,
			password,
		})
	}).then(r => {
		if (r.redirected) window.location.replace(r.url)
		return r
	})


function Login() {
	// TODO: add login page
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	return <div className="log_sign_wrapper">
		<div style={{display:'flex'}}> <p>sign in to your <b>STRONT.</b> account</p></div>
		<input type="email" onChange={e => setEmail(e.currentTarget.value)} placeholder="email" />
		<input type="password" onChange={e => setPassword(e.currentTarget.value)} placeholder="password" />
		<button
			className="submit_button"
			onClick={async () => await loginRequest(email, password)}>
			Login
		</button>
	</div>
}

export const Route = createFileRoute('/login/')({
	component: Login,
})
