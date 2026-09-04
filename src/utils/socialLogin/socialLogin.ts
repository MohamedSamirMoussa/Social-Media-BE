import { OAuth2Client, TokenPayload } from "google-auth-library";


const client = new OAuth2Client()


export const loginWithGoogle = async (token:string)=>{
    const ticket = await client.verifyIdToken({
        idToken:token,
        audience:process.env.CLIENT_GOOGLE_ID as string
    })

    const payload = ticket.getPayload()

    return payload as TokenPayload
}