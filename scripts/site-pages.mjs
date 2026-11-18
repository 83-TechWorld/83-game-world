// About, Contact and Privacy pages. Used by scripts/seo.mjs, which writes them to public/.
export const CONTACT_EMAIL = 'sathishkumar.kanda@gmail.com' // shown publicly on the Contact and Privacy pages
const POLICY_DATE = 'November 19, 2026'               // change this whenever the privacy text changes

export const FOOTER_LINKS = [
  ['About', '/about/index.html'],
  ['Contact', '/contact/index.html'],
  ['Privacy Policy', '/privacy-policy/index.html'],
]

export function sitePages({ BRAND, GAMES, LEARN }) {
  const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`
  const list = games => `<ul>${games.map(g => `<li><a href="/games/${g.slug}/index.html">${g.name}</a> (ages ${g.age[1] < 99 ? `${g.age[0]}-${g.age[1]}` : `${g.age[0]}+`})</li>`).join('')}</ul>`
  return [
    { slug: 'about', title: `About ${BRAND}`, desc: `${BRAND} is a free collection of browser games that help children practise letters, numbers, words, time, safety and good habits.`,
      body: `<h1>About ${BRAND}</h1>
<p>${BRAND} is a free website of browser games for children. Our learning games cover the alphabet, numbers, shapes, English words, spelling, the solar system, telling the time, safety, good habits and memory.</p>
<p>There is nothing to install and no account to create. Games run on phones, tablets and computers, and progress is saved in your own browser.</p>
<h2>How we choose what to build</h2>
<p>We aim for short levels, clear goals and friendly feedback, so a child can play for a few minutes and feel successful. Each game page explains how to play, which skills it practises and how a parent or teacher can continue the learning away from the screen.</p>
<h2>Learning games</h2>${list(GAMES.filter(g => LEARN.includes(g.slug)))}
<h2>Action games for older children</h2>
<p>These games have their own age guidance, and some include cartoon combat. Please preview them before letting a child play.</p>${list(GAMES.filter(g => !LEARN.includes(g.slug)))}
<h2>How the site is funded</h2>
<p>The games are free. We plan to pay for the site with advertising, and there are no subscriptions or in-game purchases. Read our <a href="/privacy-policy/index.html">Privacy Policy</a> to learn how ads work here.</p>` },

    { slug: 'contact', title: `Contact ${BRAND}`, desc: `Contact ${BRAND} with questions about our free kids games, privacy, advertising or anything that needs fixing.`,
      body: `<h1>Contact us</h1>
<p>Parents, teachers and advertisers can reach us by email at ${mail}.</p>
<h2>Useful details to include</h2>
<ul><li>The name of the game or page</li><li>The device and browser you were using</li><li>What happened, and what you expected to happen</li></ul>
<h2>Report an ad or a problem</h2>
<p>If you see an advertisement that seems unsuitable for children, please tell us the page and what the ad showed. A screenshot helps if you have one.</p>
<h2>A note for children</h2>
<p>Please ask a parent, carer or teacher to write to us for you, and do not send us your name, address, school or photos.</p>` },

    { slug: 'privacy-policy', title: `Privacy Policy | ${BRAND}`, desc: `How ${BRAND} protects children's privacy: no accounts, game progress stays on your device, and ads are requested without personalisation.`,
      body: `<h1>Privacy Policy</h1>
<p><em>Last updated: ${POLICY_DATE}</em></p>
<p>${BRAND} (kidsgames4u.com) is directed to children and families. This policy explains, in plain language, what happens to information when someone uses the site.</p>
<h2>The short version</h2>
<ul><li>No registration, accounts or profiles.</li><li>We do not ask children for names, email addresses, photos or locations to use the site.</li><li>Game progress stays in your browser and is not sent to us.</li><li>We do not use analytics or social media tracking tools.</li><li>Ads are requested with child protections on, so they are not personalised.</li></ul>
<h2>Information saved on your device</h2>
<p>Games use your browser's local storage to remember stars, unlocked levels, sound settings and game choices. Some games let a player type a name, such as a hero name or a name for a certificate. Those names stay on the device and are not sent to us. Please encourage children to use a nickname.</p>
<p>You can erase this information at any time by clearing this site's data in your browser settings.</p>
<h2>Voices and sound</h2>
<p>Spoken words use the speech feature of your own browser or device. The games do not use the microphone or camera.</p>
<h2>Website hosting</h2>
<p>Like all websites, ours must receive basic technical information to deliver pages. Our hosting provider, Netlify, may process details such as IP address, browser type, requested page and time of visit to run and secure the service. We do not use this information to identify children or build profiles.</p>
<h2>Advertising</h2>
<p>We use, or plan to use, Google AdSense to pay for the site. We tag ad requests for child treatment. Under this setting Google turns off personalised advertising and remarketing and applies its ad-serving protections for children. Ads are chosen from general signals such as the content of the page and approximate location.</p>
<p>Google may still process technical information, such as IP address and device or browser details, and may use cookies or similar technologies where permitted to deliver ads, limit how often they appear, measure them and prevent fraud. Learn more in <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses information from sites that use its services</a>.</p>
<p>Visitors in some regions, including the European Economic Area, the United Kingdom and Switzerland, may see a privacy message before ads are shown.</p>
<h2>Children's privacy</h2>
<p>We do not knowingly collect personal information from children. This site is designed with the United States Children's Online Privacy Protection Act (COPPA) and the children's data protections of the GDPR and UK GDPR in mind. If a child has sent us personal information, such as by email, a parent or guardian can contact us and we will delete it.</p>
<h2>Your choices and rights</h2>
<p>Parents and guardians can contact us to ask what information we hold about their child, ask us to delete it, or refuse further collection. Because we do not run accounts, we normally hold nothing beyond messages people send us. Information handled by Google is covered by Google's own privacy tools and policies.</p>
<h2>Links to other sites</h2>
<p>Ads and a few links may lead to other websites with their own privacy practices. We encourage parents to supervise children online.</p>
<h2>Changes to this policy</h2>
<p>If our practices change, we will update this page and the date at the top.</p>
<h2>Contact</h2>
<p>${BRAND}<br>Email: ${mail}</p>` },
  ].map(p => ({ ...p, html: pageHtml(p, BRAND) }))
}

function pageHtml(p, BRAND) {
  const links = FOOTER_LINKS.map(([t, u]) => `<a href="${u}">${t}</a>`).join(' &middot; ')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<style>
body{margin:0;background:#eaf7ff;color:#1c2a55;font:500 17px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif}
nav{padding:14px 18px;background:#fff;font-weight:800}main{box-sizing:border-box;max-width:760px;margin:22px auto;padding:10px 24px 26px;background:#fff;border-radius:18px}
h1{font-size:32px;line-height:1.2}h2{font-size:21px;margin-top:28px}a{color:#2848c7;overflow-wrap:anywhere}footer{text-align:center;padding:4px 16px 34px;font-size:15px}
</style>
</head>
<body>
<nav><a href="/">&larr; ${BRAND}</a></nav>
<main>
${p.body}
</main>
<footer>${links}</footer>
</body>
</html>
`
}
