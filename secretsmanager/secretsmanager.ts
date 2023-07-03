import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { Construct } from "constructs";

export type GenericSecretConfig = {
    name?: string,
    description?: string,
    kmsKeyId?: string,
    policy?: string,
    forceOverwriteReplicaSecret?: boolean,
    recoveryWindowInDays?: number,
    tags?: { [key: string]: string; },
};

export class GenericSecret extends SecretsmanagerSecret {
    constructor(
        scope: Construct,
        id: string,
        config: GenericSecretConfig,
        secretString: string,
    ) {
        super(scope, id, config);

        new SecretsmanagerSecretVersion(this, "sm-sv", {
            secretId: this.arn,
            secretString: secretString
        });
    }
}

export class GoogleProjectOAuth2Secret extends GenericSecret {
    private static instance: GoogleProjectOAuth2Secret;
    private constructor(
        scope: Construct,
        id: string,
        secretString: string,
    ) {
        super(scope, id, {
            name: "GoogleProjectOAuth2Secret",
            description: "OAuth2 Token for Google Cloud Project integration."
        }, secretString);
    }

    public static getInstance(scope: Construct, id: string, secretString: string): GoogleProjectOAuth2Secret {
        if (!this.instance) {
            this.instance = new GoogleProjectOAuth2Secret(scope, id, secretString);
        }

        return this.instance;
    }
}