import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

// WARNING: this does not currently work, as the backend endpoint has not been
// added
const signupRequest = (email: string, password: string) =>
	fetch("/api/sign-up", {
		method: "POST",
		body: JSON.stringify({
			email,
			password,
		})
	}).then(r => {
		if (r.redirected) window.location.replace(r.url)
		return r
	})


function SignUp() {
	// TODO: add sign up page
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	return <div className="log_sign_wrapper">
		<div><p>never <b>STRONT</b>ed before?</p></div>
		<h3>CREATE ACCOUNT</h3>

		<input type="email" onChange={e => setEmail(e.currentTarget.value)} placeholder="email" />
		<input type="password" onChange={e => setPassword(e.currentTarget.value)} placeholder="password" />
		<button
			className="submit_button"
			onClick={async () => await signupRequest(email, password)}>
			Sign Up
		</button>
	</div>
}

export const Route = createFileRoute('/sign-up/')({
	component: SignUp,
})
