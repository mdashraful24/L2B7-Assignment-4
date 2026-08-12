import { OAuth2Client } from "google-auth-library";
import config from "../config";

const googleClient = new OAuth2Client({
    clientId: config.google.clientId,
});

export { googleClient };
