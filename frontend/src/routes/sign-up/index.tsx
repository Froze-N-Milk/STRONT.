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
	})


function SignUp() {
	// TODO: add sign up page
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
			onClick={async () => await signupRequest(email, password)}>
			Sign Up
		</button>
	</div>
}

export const Route = createFileRoute('/sign-up/')({
	component: SignUp,
})
