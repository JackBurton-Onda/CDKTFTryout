import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { Fn, TerraformIterator } from "cdktf";
import { Construct } from "constructs";

export type SMSecret = {
    description?: string | undefined,
    kms_key_id?: string | undefined,
    name_prefix?: string | undefined,
    policy?: string | undefined, // TODO: Validate as JSON document representing a resource policy.
    recovery_window_in_days?: number | undefined,
    replica_regions?: Map<string, string> | undefined, // Must be key(valid AWS Region), value(valid AWS arn).
    secret_string?: string,
    secret_key_value?: Map<string, string>,
};
export type SMTags = Map<string, string | number | boolean>;

export type SecretsManagerInput = {
    Secrets: Map<string, SMSecret>,
    DefaultTags?: SMTags,
    default_recovery_window_in_days?: number,
    // Unmanaged: boolean,
};

export class DepGenericSecretsManager extends Construct {
    constructor(scope: Construct, id: string, input: SecretsManagerInput | any) {
        super(scope, id);

        const secretsIterator = TerraformIterator.fromMap(input.Secrets);

        const aws_secretsmanager_secret = new SecretsmanagerSecret(this, "sm", {
            forEach: secretsIterator,
            name: secretsIterator.key,
            // namePrefix: secretsIterator.getString("name_prefix") ,
            description: secretsIterator.getString("description"),
            // kmsKeyId: secretsIterator.getString("kms_key_id"),
            policy: secretsIterator.getString("policy"),
            // forceOverwriteReplicaSecret: Fn.lookup(secretsIterator.value, "force_overwrite_replica_secret", false),
            recoveryWindowInDays: secretsIterator.getNumber("recovery_window_in_days"),
            // tags: Fn.merge([input.DefaultTags, Fn.lookup(secretsIterator.value, "tags", undefined)])
        });

        aws_secretsmanager_secret.addOverride("dynamic.replica", {
            for_each: Fn.lookup(secretsIterator.value, "replica_regions", {}),
            content: {
                region: "${replica.key}",
                kms_key_id: "${replica.value}"
            }
        });

        new SecretsmanagerSecretVersion(this, "sm-sv", {
            forEach: secretsIterator,
            secretId: secretsIterator.key,
            secretString: secretsIterator.getString("secret_string"),
            // secretBinary: Fn.lookup(secretsIterator.value, "secret_binary", undefined) != undefined ? Fn.base64encode(secretsIterator.getString("secret_binary")) : undefined,
            dependsOn: [aws_secretsmanager_secret],
            lifecycle: {
                ignoreChanges: ["secret_id"]
            }
        });
    }
}

type OAuthTokens = Map<string, [string, string]>;

export class OAuthTokenSecretsManager extends Construct {
    constructor(scope: Construct, id: string, tokens: OAuthTokens) {
        super(scope, id);

        const OAuthInterator = TerraformIterator.fromMap(tokens);

        new DepGenericSecretsManager(this, "gsm", {
            Secrets: OAuthInterator.dynamic({
                secret_key_1: {
                    description: "This is a description"
                }
            }),
            default_recovery_window_in_days: 7,
        });
    }
}