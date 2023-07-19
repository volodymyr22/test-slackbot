const { App, LogLevel } = require("@slack/bolt");
const { registerListeners } = require("./listeners");
const orgAuth = require("./database/auth/store_user_org_install");
const workspaceAuth = require("./database/auth/store_user_workspace_install");
const db = require("./database/db");
const dbQuery = require("./database/find_user");
// const customRoutes = require("./utils/custom_routes");
const slackConfiguration = require("./slack_configuration.json");
const { WebClient } = require("@slack/web-api");
// const { v4: uuidv4 } = require("uuid");
// const express = require("express");

// const server = express();
// const port = 4001;

// // server.use(express.json());
// // server.use(express.urlencoded({ extended: true }));

// // server.listen(port, () => {
// //   console.log(`Server has been started ${port}`);
// // });

const blocks = [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: ":fire:New post published: \n\n *Rank the following colors:*",
    },
  },
  {
    type: "divider",
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Yellow",
        },
        value: "yellow",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Blue",
        },
        value: "Blue",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Green",
        },
        value: "Green",
      },
    ],
  },
];

// const blocks = [
//   {
//     type: "section",
//     text: {
//       type: "mrkdwn",
//       text: "Click the button below to register:",
//     },
//   },
//   {
//     type: "actions",
//     elements: [
//       {
//         type: "button",
//         text: {
//           type: "plain_text",
//           text: "Register",
//           emoji: true,
//         },
//         action_id: "registration_button", // Add the action_id property to the button
//       },
//     ],
//   },
// ];

const app = new App({
  logLevel: LogLevel.DEBUG,
  signingSecret: slackConfiguration.SLACK_SIGNING_SECRET,
  clientId: slackConfiguration.SLACK_CLIENT_ID,
  clientSecret: slackConfiguration.SLACK_CLIENT_SECRET,
  botId: slackConfiguration.SLACK_BOT_TOKEN,
  // userId: slackConfiguration.SLACK_USER_TOKEN,
  installerOptions: {
    stateVerification: false,
  },
  installationStore: {
    storeInstallation: async (installation) => {
      console.log("installation: " + installation);
      console.log(installation);
      const userId = installation.user.id;
      const botToken = installation.bot.token;
      const userToken = installation.user.token;
      openDM(userId, userToken, "Hello there!", blocks);
      if (
        installation.isEnterpriseInstall &&
        installation.enterprise !== undefined
      ) {
        return orgAuth.saveUserOrgInstall(installation);
      }
      if (installation.team !== undefined) {
        return workspaceAuth.saveUserWorkspaceInstall(installation);
      }
      throw new Error("Failed saving installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        return dbQuery.findUser(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        return dbQuery.findUser(installQuery.teamId);
      }
      throw new Error("Failed fetching installation");
    },
  },
});

async function openDM(userId, userToken, message) {
  const client = new WebClient(userToken);
  try {
    const response = await client.conversations.open({
      users: userId,
    });

    if (response.ok) {
      console.log(response.channel, "channel obj");
      const channelId = response.channel.id;
      console.log("Direct message channel opened:", channelId);
      sendMessageToDM(userId, channelId, message, client);
    } else {
      console.log("Failed to open direct message channel:", response.error);
    }
  } catch (error) {
    console.error("Error opening direct message channel:", error);
  }
}

async function sendMessageToDM(userId, channelId, messageText, client) {
  try {
    const response = await client.chat.postMessage({
      // channel: channelId,
      channel: userId,
      text: messageText,
    });
    if (response.ok) {
      console.log("Message sent successfully!");
    } else {
      console.log("Failed to send message:", response.error);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

function generateRegistrationLink(userId) {
  const registrationToken = uuidv4(); // Generate a unique registration token using UUID v4
  const registrationLink = `https://your-domain.com/register/${registrationToken}?userId=${userId}`;

  return registrationLink;
}

registerListeners(app);

(async function sendMessage(userId, messageText, userToken) {
  userId = "";
  messageText = "";
  userToken = "";

  if ((userId, messageText, userToken)) {
    const client = new WebClient(userToken);

    try {
      const response = await client.chat.postMessage({
        channel: userId,
        text: messageText,
        blocks,
      });
      if (response.ok) {
        console.log("Message sent successfully!");
      } else {
        console.log("Failed to send message:", response.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
})();

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running! ⚡️");

    db.connect();
    console.log("DB is connected.");
  } catch (error) {
    console.error("Unable to start App", error);
  }
})();
