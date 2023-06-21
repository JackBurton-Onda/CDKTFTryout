import { Construct } from "constructs";
import { TerraformIterator, Fn } from "cdktf";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";

type SMSecret = {
    description?: string | undefined,
    kms_key_id?: string | undefined,
    name_prefix?: string | undefined,
    policy?: string | undefined, // TODO: Validate as JSON document representing a resource policy.
    recovery_window_in_days?: number | undefined,
    replica_regions?: Map<string, string> | undefined, // Must be key(valid AWS Region), value(valid AWS arn).
    secret_string?: string,
    secret_key_value?: Map<string, string>,
}
type SMTags = Map<string, string | number | boolean>

type SecretsManagerInput = {
    Secrets: Map<string, SMSecret>,
    DefaultTags?: SMTags,
    default_recovery_window_in_days?: number,
    // Unmanaged: boolean,
}



export class GenericSecretsManager extends Construct {
    constructor(scope: Construct, id: string, input: SecretsManagerInput | any) {
        super(scope, id);

        const secretsIterator = TerraformIterator.fromMap(input.Secrets);

        const aws_secretsmanager_secret = new SecretsmanagerSecret(this, "sm", {
            forEach: secretsIterator,
            name: secretsIterator.getString("name_prefix") == "" ? secretsIterator.key : undefined,
            namePrefix: Fn.lookup(secretsIterator.value, "name_prefix", undefined) != undefined ? secretsIterator.getString("name_prefix") : undefined,
            description: Fn.lookup(secretsIterator.value, "description", undefined),
            kmsKeyId: Fn.lookup(secretsIterator.value, "kms_key_id", undefined),
            policy: Fn.lookup(secretsIterator.value, "policy", undefined),
            forceOverwriteReplicaSecret: Fn.lookup(secretsIterator.value, "force_overwrite_replica_secret", false),
            recoveryWindowInDays: Fn.lookup(secretsIterator.value, "recover_window_in_days", input.default_recovery_window_in_days),
            tags: Fn.merge([input.DefaultTags, Fn.lookup(secretsIterator.value, "tags", undefined)])
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
            secretString: Fn.lookup(secretsIterator.value, "secret_string", undefined) != undefined ? Fn.lookup(secretsIterator.value, "secret_string", undefined) : (Fn.lookup(secretsIterator.value, "secret_key_value", undefined) != undefined ? Fn.jsonencode(Fn.lookup(secretsIterator.value, "secret_key_value", {})) : undefined),
            secretBinary: Fn.lookup(secretsIterator.value, "secret_binary", undefined) != undefined ? Fn.base64encode(secretsIterator.getString("secret_binary")) : undefined,
            dependsOn: [aws_secretsmanager_secret],
            lifecycle: {
                ignoreChanges: ["secret_id"]
            }
        });
    }
}

// type OAuthTokens = Map<string, [string, string]>;

// export class OAuthTokenSecretsManager extends Construct {
//     constructor(scope: Construct, id: string, tokens: OAuthTokens) {
//         super(scope, id);

//         new GenericSecretsManager(this, "gsm", {
//             Secrets: secretsMap,
//             default_recovery_window_in_days: 7,
//         });
//     }
// }