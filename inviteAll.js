const WebSocketClient = require("websocket").client;
const vrchat = require("vrchat");
const throttledQueue = require('throttled-queue');
const { InstancesApi } = require("vrchat");

//LOGIN DATA
const configuration = new vrchat.Configuration({
    username: "SECRET",
    password: "SECRET"
  });

//CONFIGURABLE
let userAgent = "Awesome Friend Bot"

const instanceid = 'wrld_ed02983c-84bd-4697-9b5b-03662a173f8f:55098~private(usr_d0e9d26e-e1c9-4aeb-90ee-920d2c0e260c)~region(us)~nonce(475919b5-e0ba-4079-b8f8-a41e21285028)'

//APIS
const AuthenticationApi = new vrchat.AuthenticationApi(configuration);
const NotificationsApi = new vrchat.NotificationsApi(configuration);
const InviteApi = new vrchat.InviteApi(configuration);
const FriendsApi = new vrchat.FriendsApi(configuration);


let currentUser;
let vrcHeaders; //Used to connect
const throttle = throttledQueue(3, 60000, true); // Adding RateLimit, 3 request per minutes

//CONNECTION CODE
AuthenticationApi.getCurrentUser().then((resp) => {
    currentUser = resp.data;
    console.log("Logged in : " + currentUser.displayName)
    throttle(() => {
        AuthenticationApi.verifyAuthToken().then((resp) => {
        console.log(`Got auth cookie`);
        vrcHeaders = {
            "User-Agent": userAgent,
            Auth_Cookie: resp.data.token,
        };

        var client = new WebSocketClient();

        client.on("connectFailed", function (error) {
            console.log("Connect Error: " + error.toString());
        });

        client.on("connect", function (connection) {
            console.log("WebSocket Client Connected");

            let friends = [];
            console.log("Getting friends");
            FriendsApi.getFriends().then((resp) => {
                friends = resp.data;
                friends.forEach(friend => {
                    InviteApi.inviteUser(friend.id, { instanceId: instanceid }).then(() => {
                        console.log("Sending invite to " + friend.displayName);
                    }).catch(err=>{console.log(err)});
                });
            }).then(() => {
                console.log("Done");
            }).catch(err=>{console.log(err)});
        });

        client.connect(
            "wss://pipeline.vrchat.cloud/?authToken=" + resp.data.token,
            "echo-protocol",
            null,
            {
                "User-Agent": userAgent
            }
        );
    });
    });	
});

