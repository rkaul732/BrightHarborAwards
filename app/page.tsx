import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";
import RecognitionApp from "./recognition-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  if (user) return <RecognitionApp identity={{ email: user.email, name: user.displayName }} />;
  return <main className="login-page">
    <div className="login-header"><div className="brandmark">✦</div><span>BRIGHT HARBOR <b>RECOGNITION</b></span></div>
    <section className="login-panel"><div className="eyebrow">A LITTLE APPRECIATION GOES A LONG WAY</div><h1>Great work deserves<br/><em>to be seen.</em></h1><p>Celebrate the people who make every day brighter. Share a shout-out, lift up a teammate, and watch appreciation spread.</p><a className="button button-primary login-button" href={chatGPTSignInPath("/")} target="_top">Sign in to continue <span>→</span></a><div className="login-note">A private space for the Bright Harbor team</div></section>
    <div className="login-decoration"><span>✳</span><span>★</span><span>✦</span><div className="recognition-sample"><div className="tiny-avatar">AM</div><div><strong>Alex recognized Jordan</strong><p>“Your kindness made all the difference today.”</p><small>✦ +3 recognition points</small></div></div></div>
    <footer className="login-footer">BRIGHT HARBOR AWARDS <span>Every contribution counts.</span></footer>
  </main>;
}
