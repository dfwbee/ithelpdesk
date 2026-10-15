// A small troubleshooting knowledge base for the educational prototype.
// These are general self-help steps, not company procedures.
// To add an article, copy one block and change the text.
export const articles = [
  {
    slug: "vpn-keeps-dropping",
    title: "VPN keeps dropping",
    category: "Network",
    keywords: ["vpn", "disconnect", "remote", "home", "connection"],
    summary: "The VPN connects but disconnects every few minutes.",
    steps: [
      "Check that your normal internet works without the VPN. Open a website to test.",
      "Move closer to the router, or switch from Wi-Fi to a cable if you can.",
      "Disconnect the VPN completely, wait 30 seconds, then connect again.",
      "Restart your computer and try again.",
      "Check that the VPN app is up to date and update it if there is an update.",
      "Try a different network, such as a phone hotspot, to see if your home network is the cause.",
    ],
    escalate:
      "Submit a ticket if it still drops. Include the time it dropped, how often, and any error message you saw.",
  },
  {
    slug: "wifi-slow",
    title: "Wi-Fi is very slow",
    category: "Network",
    keywords: ["wifi", "wi-fi", "slow", "internet", "speed", "lag"],
    summary: "Pages load slowly or video calls freeze.",
    steps: [
      "Check whether the slowness affects one website or everything.",
      "Turn your device's Wi-Fi off and on again.",
      "Move closer to the access point. Walls and lifts weaken the signal.",
      "Close apps that use a lot of data, such as large downloads or video streams.",
      "Restart your computer.",
      "Ask a colleague nearby if they have the same problem. If they do, it is likely a network issue.",
    ],
    escalate:
      "Submit a ticket if several people are affected. Include the location and the time it gets slow.",
  },
  {
    slug: "printer-offline",
    title: "Printer shows offline",
    category: "Hardware",
    keywords: ["printer", "print", "offline", "paper", "queue"],
    summary: "You send a document but the printer says it is offline.",
    steps: [
      "Check that the printer is switched on and shows no error light or message.",
      "Check the paper tray and look for a paper jam.",
      "Check that the printer is connected to the network (cable or Wi-Fi).",
      "On your computer, open the print queue and cancel any stuck jobs.",
      "Choose the printer again from the list and print a test page.",
      "Switch the printer off, wait 30 seconds, and switch it back on.",
    ],
    escalate:
      "Submit a ticket if the printer stays offline. Include the printer's name or location and what its screen says.",
  },
  {
    slug: "monitor-flickering",
    title: "Monitor is flickering",
    category: "Hardware",
    keywords: ["monitor", "screen", "display", "flicker", "cable", "hdmi"],
    summary: "The screen flickers, flashes or goes blank for a moment.",
    steps: [
      "Check that the video cable (HDMI, DisplayPort or VGA) is firmly plugged in at both ends.",
      "Try a different cable if you have one. A worn cable is the most common cause.",
      "Press the monitor's menu button and check the refresh rate setting.",
      "Unplug the monitor, wait one minute, and plug it back in.",
      "Try the monitor on a different computer to see if the monitor itself is the problem.",
    ],
    escalate:
      "Submit a ticket if it still flickers. Include the monitor's location and whether swapping the cable helped.",
  },
  {
    slug: "laptop-battery-drain",
    title: "Laptop battery drains quickly",
    category: "Hardware",
    keywords: ["laptop", "battery", "charge", "power", "drain"],
    summary: "The battery runs out much faster than it used to.",
    steps: [
      "Lower the screen brightness.",
      "Close apps you are not using, especially video calls and browser tabs.",
      "Turn on the battery saver or power saver mode.",
      "Restart your laptop. Some apps keep running in the background after days of use.",
      "Check the battery health in your system settings, if it is shown.",
    ],
    escalate:
      "Submit a ticket if the battery lasts less than an hour on a full charge. Include the laptop model and age if you know them.",
  },
  {
    slug: "password-reset",
    title: "Locked out or forgot my password",
    category: "Access",
    keywords: ["password", "reset", "locked", "login", "account", "sign in"],
    summary: "You cannot sign in because the password is wrong or the account is locked.",
    steps: [
      "Check that Caps Lock is off and that you are typing the right username.",
      "Use the 'Forgot password' link on the sign-in page, if there is one.",
      "If the account is locked, wait 15 to 30 minutes and try once more.",
      "Choose a new password that you have not used anywhere else.",
      "Never share your password with anyone, including support staff.",
    ],
    escalate:
      "Submit a ticket if you still cannot sign in. Include your username. Never put your password in a ticket.",
  },
  {
    slug: "shared-folder-access-denied",
    title: "Access denied to a shared folder",
    category: "Access",
    keywords: ["shared", "folder", "drive", "access", "denied", "permission"],
    summary: "You see 'access denied' when opening a shared drive or folder.",
    steps: [
      "Check that you are signed in with your own work account.",
      "Check that you typed the folder address correctly.",
      "Sign out and sign in again. New permissions sometimes only apply after signing in again.",
      "Ask a colleague who can open the folder to confirm the folder still exists.",
      "Ask the folder's owner or your manager to approve your access.",
    ],
    escalate:
      "Submit a ticket to request access. Include the folder name or address and who owns it.",
  },
  {
    slug: "outlook-not-syncing",
    title: "Email is not updating",
    category: "Software",
    keywords: ["outlook", "email", "mail", "sync", "inbox", "not updating"],
    summary: "New emails do not arrive, or sent emails stay in the outbox.",
    steps: [
      "Check that you are online. Open a website to test your connection.",
      "Look at the bottom of the email app for a message such as 'Working offline' and turn offline mode off.",
      "Check that your mailbox is not full.",
      "Close the email app completely and open it again.",
      "Try the web version of your email to see if messages arrive there.",
      "Restart your computer.",
    ],
    escalate:
      "Submit a ticket if mail still does not update. Include the time it stopped and whether the web version works.",
  },
  {
    slug: "email-attachment-blocked",
    title: "Email attachment is blocked or too large",
    category: "Software",
    keywords: ["email", "attachment", "blocked", "large", "size", "send"],
    summary: "An email will not send because of the attachment.",
    steps: [
      "Check the file size. Many mail systems limit attachments to around 10 to 25 MB.",
      "Compress large files into a zip file, or reduce the size of images.",
      "Share a link from your approved cloud storage instead of attaching the file.",
      "Some file types, such as programs and scripts, are blocked on purpose for security. Rename or zip them only if you are allowed to send them.",
    ],
    escalate:
      "Submit a ticket if you need to send a blocked file type for work. Include why you need to send it.",
  },
  {
    slug: "request-new-software",
    title: "Requesting new software",
    category: "Software",
    keywords: ["install", "software", "app", "request", "new laptop", "teams"],
    summary: "You need an application installed on your computer.",
    steps: [
      "Check whether the app is already installed or available in your company software portal.",
      "Do not download installers from unknown websites. They can contain malware.",
      "Note the name and version of the software, and why you need it.",
      "Ask your manager to approve the request if your team requires approval.",
    ],
    escalate:
      "Submit a ticket with the software name, version, what you need it for, and your manager's approval if you have it.",
  },
];